import { sql } from "@agesoma/db";
import type { DueWatcher } from "../types";
import { evaluateRoutine, queueRoutineObservation } from "./routine-runtime";

type RoutineEvent = {
  id: string;
  tenant_id: string;
  watcher_id: string;
  trigger_kind: "event"|"webhook"|"manual";
  source: string;
  payload: Record<string,unknown>;
  received_at: Date|string;
};

async function loadWatcher(event: RoutineEvent) {
  const [watcher]=await sql<DueWatcher>(`
    select id,tenant_id,goal_id,cadence,config,connected_service_id,
      worker_id,trigger_kind,trigger_config,interrupt_policy
    from watchers
    where tenant_id=$1 and id=$2 and status='active'
    limit 1
  `, [event.tenant_id,event.watcher_id]);
  return watcher??null;
}

export async function dispatchRoutineEvents() {
  const events=await sql<RoutineEvent>(`
    with due as (
      select e.id
      from routine_events e
      join watchers w
        on w.tenant_id=e.tenant_id and w.id=e.watcher_id
      where e.status='pending'
        and e.available_at<=now()
        and w.status='active'
        and w.trigger_kind in ('event','webhook','manual')
      order by e.received_at asc
      for update of e skip locked
      limit 20
    )
    update routine_events e
    set available_at=now()+interval '1 minute',updated_at=now()
    from due
    where e.id=due.id
    returning e.id,e.tenant_id,e.watcher_id,e.trigger_kind,e.source,e.payload,e.received_at
  `);

  for(const event of events){
    try{
      const [existingTask]=await sql<{id:string}>(`
        select id from tasks
        where tenant_id=$1 and payload->>'routineEventId'=$2
        limit 1
      `,[event.tenant_id,event.id]);
      if(existingTask){
        await sql(`
          update routine_events
          set status='dispatched',task_id=$3,processed_at=now(),failure_reason=null,updated_at=now()
          where id=$1 and tenant_id=$2 and status='pending'
        `,[event.id,event.tenant_id,existingTask.id]);
        continue;
      }

      const watcher=await loadWatcher(event);
      if(!watcher||watcher.trigger_kind!==event.trigger_kind){
        await sql(`
          update routine_events
          set status='dropped',processed_at=now(),failure_reason='routine_unavailable',updated_at=now()
          where id=$1 and tenant_id=$2 and status='pending'
        `,[event.id,event.tenant_id]);
        continue;
      }

      const eligibility=await evaluateRoutine(watcher);
      if(!eligibility.ready){
        if(eligibility.reason==="task_active"){
          await sql(`
            update routine_events
            set available_at=now()+interval '30 seconds',updated_at=now()
            where id=$1 and tenant_id=$2 and status='pending'
          `,[event.id,event.tenant_id]);
          continue;
        }

        await sql(`
          update routine_events
          set status='dropped',processed_at=now(),failure_reason=$3,updated_at=now()
          where id=$1 and tenant_id=$2 and status='pending'
        `,[event.id,event.tenant_id,eligibility.reason]);
        continue;
      }

      const task=await queueRoutineObservation({
        watcher,
        eligibility,
        event:{
          id:event.id,
          source:event.source,
          receivedAt:event.received_at,
          payload:event.payload
        }
      });

      await sql(`
        update routine_events
        set status='dispatched',task_id=$3,processed_at=now(),failure_reason=null,updated_at=now()
        where id=$1 and tenant_id=$2 and status='pending'
      `,[event.id,event.tenant_id,task.id]);

      await sql(`
        update watchers set last_checked_at=now(),updated_at=now()
        where id=$1 and tenant_id=$2
      `,[watcher.id,watcher.tenant_id]);
    }catch(error){
      const reason=error instanceof Error?error.message:"routine_event_dispatch_failed";
      await sql(`
        update routine_events
        set status='failed',processed_at=now(),failure_reason=$3,updated_at=now()
        where id=$1 and tenant_id=$2 and status='pending'
      `,[event.id,event.tenant_id,reason.slice(0,1000)]).catch(()=>undefined);
    }
  }
}

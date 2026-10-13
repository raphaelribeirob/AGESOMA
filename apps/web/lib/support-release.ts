import {supportReleaseAssessment,type ReleaseEvidence} from "@agesoma/core";
import {tenantSql} from "@agesoma/db";

type Row={
 content_version:string|number;
 evaluated_version:string|number|null;
 skill_version:string|null;
 cases_count:number|null;
 passed_count:number|null;
 details:unknown;
};

/** Selects the current DB content revision and latest QA run together.
 * No client-provided flag can override a failing/missing release evaluation.
 */
export async function latestSupportRelease(tenantId:string,workspaceId:string){
 const [row]=await tenantSql<Row>(tenantId,[
  "select w.content_version,r.content_version as evaluated_version,r.skill_version,r.cases_count,r.passed_count,r.details",
  "from support_workspaces w",
  "left join lateral (",
  " select skill_version,cases_count,passed_count,details,content_version",
  " from support_eval_runs where tenant_id=w.tenant_id and workspace_id=w.id",
  " order by created_at desc,id desc limit 1",
  ") r on true",
  "where w.tenant_id=$1 and w.id=$2 limit 1"
 ].join(" "),[tenantId,workspaceId]);
 if(!row)return {ready:false,reason:"workspace_missing"} as const;
 const evidence=row.skill_version===null?null:{
  content_version:row.evaluated_version??0,
  skill_version:row.skill_version,
  cases_count:row.cases_count??0,
  passed_count:row.passed_count??0,
  details:row.details
 } satisfies ReleaseEvidence;
 return supportReleaseAssessment(row.content_version,evidence);
}

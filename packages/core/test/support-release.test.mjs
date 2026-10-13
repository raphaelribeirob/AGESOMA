import test from "node:test";
import assert from "node:assert/strict";
import {SUPPORT_SKILL,SUPPORT_SKILL_VERSION,supportReleaseAssessment} from "../src/support-release.ts";
const sample={
 content_version:3,skill_version:SUPPORT_SKILL_VERSION,cases_count:2,passed_count:2,
 details:[{expected:"answered",passed:true},{expected:"needs_human",passed:true}]
};
test("production release requires current skill and owner-approved regression evidence",()=>{
 assert.equal(SUPPORT_SKILL.externalActions,"none");
 assert.equal(supportReleaseAssessment(3,sample).ready,true);
 assert.equal(supportReleaseAssessment(4,sample).reason,"content_changed_since_evaluation");
 assert.equal(supportReleaseAssessment(3,{...sample,skill_version:"older"}).ready,false);
 assert.equal(supportReleaseAssessment(3,{...sample,cases_count:1,passed_count:1,details:sample.details.slice(0,1)}).ready,false);
 assert.equal(supportReleaseAssessment(3,{...sample,details:[]}).ready,false);
 assert.equal(supportReleaseAssessment(3,{...sample,passed_count:1}).ready,false);
 assert.equal(supportReleaseAssessment(3,{...sample,details:[{expected:"answered",passed:true},{expected:"answered",passed:true}]}).ready,false);
 assert.equal(supportReleaseAssessment(3,null).ready,false);
 assert.equal(supportReleaseAssessment("n/a",sample).ready,false);
});

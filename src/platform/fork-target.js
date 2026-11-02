// Adapted separable user-authored _targetAfter/_assessmentTarget and title
// predicates, fork 351c08dc4d772908c3d098e8c9160be434bf1064:1683-1706.
// XXT adds bounded traversal and uses owned catalog descriptors, never URLs.
export const verificationTitle = text => /验证码|验证|认证|登录|人脸|captcha|authentication/i.test(text);
export const assessmentTitle = text => /测验|测试|自测|作业|考试|验证/.test(text);
export function optionalAssessmentTitle(text) {
  const name=text.trim().replace(/^\d+(?:\.\d+)*\s+/, '');
  return ['章节测验','章节测试','本章自测'].includes(name);
}
export function targetAfter(catalog, sourceKey, includeSource=false) {
  let index=catalog.findIndex(item=>item.key===sourceKey);
  if(index<0||catalog.filter(item=>item.key===sourceKey).length!==1)return {reason:'source-not-unique'};
  if(!includeSource)index++;
  const deferred=[];
  while(index<catalog.length && catalog[index].optionalAssessment){
    const item=catalog[index];
    if(deferred.length>=8)return {reason:'assessment-limit'};
    if(!item.chapterKey||item.restricted||!item.node.isConnected||!optionalAssessmentTitle(item.title))return {reason:'assessment-boundary'};
    deferred.push(item.key);index++;
  }
  const target=catalog[index];
  if(!target||!target.key||target.restricted||!target.node.isConnected||assessmentTitle(target.title)||verificationTitle(target.title))return {reason:'no-eligible-target'};
  if(deferred.length && (!target.chapterKey||!target.ancestry.includes(target.chapterKey)))return {reason:'uncertain-target-ancestry'};
  return {target,deferred:Object.freeze(deferred)};
}

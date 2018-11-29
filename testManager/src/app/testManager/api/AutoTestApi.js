
import axios from 'axios';
import { getProjectId, getOrganizationId, request } from '../common/utils';
import './AutoTestApiMock';

/**
 *获取当前用户
 *
 * @export
 * @returns
 */
export function getAppList() {
  return axios.get('/getAppList');
}
export function getTestHistoryByApp() {
  return axios.get('/getTestHistoryByApp');
}
export function getYaml(appId, appVersionId, envId) {
  // return axios.get('/getYaml');
  return request.get(`/test/v1/projects/${getProjectId()}/app_instances/value?appId=${appId}&envId=${envId}&appVersionId=${appVersionId}`);
}
export function checkYaml(value) {
  return axios.post(`/devops/v1/projects/${getProjectId()}/app_instances/value_format`, { yaml: value });
}

export function loadPodParam(projectId, id, type) {
  return axios.get(`devops/v1/projects/${getProjectId()}/app_pod/${5}/containers/logs`);
}
export function getApps({
  page, size, sort, postData, 
}) {
  return request.post(`/devops/v1/projects/${getProjectId()}/apps/list_by_options?active=true&page=${page}&size=${size}&sort=${sort.field},${sort.order}`, JSON.stringify(postData));
}
export function getAppVersions(appId, pagination, flag = '') {
  const { current, pageSize } = pagination;
  return request.post(`/devops/v1/projects/${getProjectId()}/app_versions/list_by_options?appId=${appId}&page=${current - 1}&size=${pageSize}&sort=id,desc`);
}
export function getEnvs() {
  return axios.post(`/devops/v1/organizations/${getOrganizationId()}/clusters/page_cluster?page=0&size=12&sort=id,desc`, { 
    param: '',
    searchParam: {}, 
  });   
}
export function runTestInstant(scheduleTaskDTO) {
  return request.post(`/test/v1/projects/${getProjectId()}/app_instances`, scheduleTaskDTO);   
}

export function runTestTiming(scheduleTaskDTO) {
  return request.post(`/test/v1/projects/${getProjectId()}/app_instances/schedule`, scheduleTaskDTO);   
}

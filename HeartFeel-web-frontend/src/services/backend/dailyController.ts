// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** addDaily POST /api/daily/add */
export async function addDailyUsingPost(
  body: API.DailyAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/daily/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteDaily POST /api/daily/delete */
export async function deleteDailyUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/daily/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** downloadDailyById GET /api/daily/download */
export async function downloadDailyByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.downloadDailyByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<any>('/api/daily/download', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** editDaily POST /api/daily/edit */
export async function editDailyUsingPost(
  body: API.DailyEditRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/daily/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getDailyContentById GET /api/daily/get/content */
export async function getDailyContentByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDailyContentByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseString_>('/api/daily/get/content', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getDailyVOById GET /api/daily/get/vo */
export async function getDailyVoByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDailyVOByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseDailyVO_>('/api/daily/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listDailyVOByPage POST /api/daily/list/page/vo */
export async function listDailyVoByPageUsingPost(
  body: API.DailyQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageDailyVO_>('/api/daily/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** listMyDailyVOByPage POST /api/daily/my/list/page/vo */
export async function listMyDailyVoByPageUsingPost(
  body: API.DailyQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageDailyVO_>('/api/daily/my/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getDailyTemplateVOById GET /api/daily/template/get/vo */
export async function getDailyTemplateVoByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDailyTemplateVOByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseDailyVO_>('/api/daily/template/get/vo', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listMyDailyTemplateVOByPage POST /api/daily/template/list/page/vo */
export async function listMyDailyTemplateVoByPageUsingPost(
  body: API.DailyQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageDailyVO_>('/api/daily/template/list/page/vo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** updateDaily POST /api/daily/update */
export async function updateDailyUsingPost(
  body: API.DailyUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/daily/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

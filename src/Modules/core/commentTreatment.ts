// src/Modules/core/commentTreatment.ts
import { Comment } from '@onecomme.com/onesdk/types/Comment';
import { SendCommentParamsType } from '@type';

export function commentTreatment(comment: Comment): Comment {
 const params = getIdParams(comment.data.id);
 if (!params) return comment;

 // isOwner(isSilent) なら読み上げを行わない
 if (params?.isSilent === 'true') comment.data.speechText = ' ';
 return comment;
}

// comment.data.id にあるパラメータをObjectにする
const getIdParams = (str: string): SendCommentParamsType | false => {
 if (/^[0-9]+[a-zA-Z0-9]*$/.test(str)) return false;

 const params = new URLSearchParams(str.replace(/,/g, '&'));
 const result: SendCommentParamsType = {
  id: params.get('id') || '',
  charaId: params.get('charaId') || ''
 };

 // パラメータを動的に処理
 params.forEach((value, key) => {
  result[key] = decodeURIComponent(value);
 });

 return result.id ? result : false;
};

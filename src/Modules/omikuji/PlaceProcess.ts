// src/Modules/tasks/PlaceProcess.ts
import { PlaceType, PlaceValueType, OmikujiType } from '@type';
import { PlayOmikuji } from '@omikuji/PlayOmikuji';

export class PlaceProcess {
 private placeholders: Record<string, string | number> = {};

 constructor(private omikuji: OmikujiType) {
  this.omikuji = structuredClone(omikuji);
 }

 // placeholdersに入れる
 updatePlace(data: Record<string, string | number>): void {
  this.placeholders = { ...this.placeholders, ...data };
 }

 // プレースホルダーの処理
 placeDataHandle(places: Record<string, PlaceType>): void {
  const processPlace = (placeId: string, visited = new Set<string>()): void => {
   if (visited.has(placeId)) return;
   visited.add(placeId);

   const place = places[placeId];
   if (place?.values.length) {
    const value = new PlayOmikuji(place.values).draw() as PlaceValueType;
    if (value) this.updatePlace({ [place.name]: value.value });

    place.placeIds.forEach((childId) => processPlace(childId, visited));
   }
  };

  this.omikuji.placeIds.forEach((id) => processPlace(id));
 }

 // プレースホルダーを置き換えし、selectOmikujiを返す
 replacementPlace(): OmikujiType {
  const replacePlaceholders = (text: string | null | undefined): string => {
   if (!text) return '';
   let result = text;
   const pattern = /<<(.*?)>>/g;

   while (pattern.test(result)) {
    const newResult = result.replace(pattern, (_, key) => String(this.placeholders[key] ?? `<<${key}>>`));
    if (newResult === result) break;
    result = newResult;
   }
   return result;
  };

  return {
   ...this.omikuji,
   addStatus:
    this.omikuji.addStatus === null
     ? null
     : this.omikuji.addStatus === undefined
     ? undefined
     : replacePlaceholders(this.omikuji.addStatus),
   addPoints:
    this.omikuji.addPoints === null
     ? null
     : this.omikuji.addPoints === undefined
     ? undefined
     : replacePlaceholders(this.omikuji.addPoints),
   post: this.omikuji.post.map((post) => ({
    ...post,
    content: replacePlaceholders(post.content),
    party: replacePlaceholders(post.party)
   }))
  };
 }
}

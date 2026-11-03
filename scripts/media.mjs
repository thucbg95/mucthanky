export const matchesSubject=(image,slug)=>Boolean(image?.verified&&image.subjects?.includes(slug));
const exactImage=(media,entry)=>{const preferred=media.images?.[entry.image||entry.slug];return matchesSubject(preferred,entry.slug)?preferred:Object.values(media.images||{}).find(image=>matchesSubject(image,entry.slug));};
const relatedImage=(image,selection,entry)=>({...image,kind:'related',illustrates:[entry.slug],relatedSubject:selection.sourceSlug,relatedTitle:selection.sourceTitle,alt:`${selection.label}. ${image.alt}`});
export const matchesEntryImage=(image,slug)=>matchesSubject(image,slug)||Boolean(image?.verified&&image.kind==='related'&&image.illustrates?.includes(slug)&&image.subjects?.includes(image.relatedSubject));
export function entryImage(media,entry){const exact=exactImage(media,entry);if(exact)return exact;const selection=media.relatedImages?.[entry.slug],image=media.images?.[selection?.image];return selection&&matchesSubject(image,selection.sourceSlug)?relatedImage(image,selection,entry):undefined;}
export function entryGallery(media,entry){
 const exact=[exactImage(media,entry),...(media.albums?.[entry.slug]||entry.gallery||[]).map(key=>media.images?.[key]),...Object.values(media.images||{}).filter(image=>matchesSubject(image,entry.slug))].filter((image,i,all)=>matchesSubject(image,entry.slug)&&all.findIndex(other=>other?.src===image.src)===i).slice(0,6);
 if(exact.length)return exact;
 const selection=media.relatedImages?.[entry.slug];if(!selection)return [];
 const source={slug:selection.sourceSlug,image:selection.image};
 return [exactImage(media,source),...(media.albums?.[source.slug]||[]).map(key=>media.images?.[key]),...Object.values(media.images||{}).filter(image=>matchesSubject(image,source.slug))].filter((image,i,all)=>matchesSubject(image,source.slug)&&all.findIndex(other=>other?.src===image.src)===i).slice(0,6).map(image=>relatedImage(image,selection,entry));
}
export function entryVideos(media,entry){
 const identity=video=>{if(video.bvid)return video.bvid;try{return new URL(video.embedUrl).searchParams.get('bvid')||video.src||video.embedUrl}catch{return video.src||video.embedUrl}};
 return [...(media.profileVideos?.[entry.slug]||[]),...(entry.videos||[])].filter(video=>video.src||video.embedUrl).filter((video,i,all)=>all.findIndex(other=>identity(other)===identity(video))===i).slice(0,3);
}

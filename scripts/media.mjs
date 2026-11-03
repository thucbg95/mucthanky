export const matchesSubject=(image,slug)=>Boolean(image?.verified&&image.subjects?.includes(slug));
export function entryImage(media,entry){const preferred=media.images?.[entry.image||entry.slug];return matchesSubject(preferred,entry.slug)?preferred:Object.values(media.images||{}).find(image=>matchesSubject(image,entry.slug));}
export function entryGallery(media,entry){return [entryImage(media,entry),...(media.albums?.[entry.slug]||entry.gallery||[]).map(key=>media.images?.[key]),...Object.values(media.images||{}).filter(image=>matchesSubject(image,entry.slug))].filter((image,i,all)=>matchesSubject(image,entry.slug)&&all.findIndex(other=>other?.src===image.src)===i).slice(0,6);}
export function entryVideos(media,entry){
 const identity=video=>{if(video.bvid)return video.bvid;try{return new URL(video.embedUrl).searchParams.get('bvid')||video.src||video.embedUrl}catch{return video.src||video.embedUrl}};
 return [...(media.profileVideos?.[entry.slug]||[]),...(entry.videos||[])].filter(video=>video.src||video.embedUrl).filter((video,i,all)=>all.findIndex(other=>identity(other)===identity(video))===i).slice(0,3);
}

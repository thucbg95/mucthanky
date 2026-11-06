export function upcomingReleases(latest,count=10,anchorEpisode=108,anchorDate='2026-11-08'){
 if(!Number.isInteger(latest)||latest<1||!Number.isInteger(count)||count<1||count>10)throw new Error('Invalid release schedule');
 const anchor=new Date(anchorDate+'T00:00:00Z');if(!Number.isFinite(anchor.getTime()))throw new Error('Invalid anchor date');
 return Array.from({length:count},(_,i)=>{const number=latest+i+1,date=new Date(anchor);date.setUTCDate(date.getUTCDate()+(number-anchorEpisode)*7);const iso=date.toISOString().slice(0,10);return{number,date:iso,label:`Lịch chiếu tập ${number}: Chủ nhật, ${iso.split('-').reverse().join('/')}.`}});
}

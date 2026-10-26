/** Optional fields already returned by product search. No additional provider calls. */
export function viatorSummary(product:any){
 const finite=(value:unknown)=>typeof value==='number'&&Number.isFinite(value);
 const rating=product.reviews?.combinedAverageRating??product.reviews?.reviewCountTotals?.combinedAverageRating;
 const reviews=product.reviews?.totalReviews,d=product.duration;
 const fixed=d?.fixedDurationInMinutes,from=d?.variableDurationFromMinutes,to=d?.variableDurationToMinutes;
 return {
  ...(finite(rating)&&rating>=1&&rating<=5?{rating}:{}),
  ...(Number.isSafeInteger(reviews)&&reviews>=0?{reviewCount:reviews}:{}),
  ...(finite(fixed)&&fixed>0?{durationMinutes:{from:fixed,to:fixed}}:finite(from)&&from>0&&finite(to)&&to>=from?{durationMinutes:{from,to}}:{}),
  ...(Array.isArray(product.flags)&&product.flags.includes('FREE_CANCELLATION')?{freeCancellation:true}:{}),
 };
}

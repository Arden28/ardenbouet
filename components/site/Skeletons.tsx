// Route-level loading skeletons (shown instantly while a page's data/code loads).
const bar = 'animate-pulse rounded bg-[#f2f2f2]';

export function TopProgress() {
  return <div className="fixed inset-x-0 top-0 z-[200] h-[2px] overflow-hidden"><div className="h-full w-1/3 animate-[route-progress_1.1s_ease-in-out_infinite] bg-[#1a8917]" /></div>;
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-[1192px] px-6 pt-14">
      <TopProgress />
      <div className={`${bar} h-12 w-2/3`} />
      <div className={`${bar} mt-5 h-5 w-1/2`} />
      <div className="mt-12 grid gap-8 md:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className={`${bar} aspect-[4/3] rounded-2xl`} />)}</div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="mx-auto max-w-[728px] px-6 pt-10">
      <TopProgress />
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="flex gap-8 border-b border-[#f2f2f2] py-8">
          <div className="flex-1 space-y-3"><div className={`${bar} h-3 w-28`} /><div className={`${bar} h-6 w-4/5`} /><div className={`${bar} h-4 w-full`} /><div className={`${bar} h-3 w-40`} /></div>
          <div className={`${bar} hidden h-[107px] w-[160px] sm:block`} />
        </div>
      ))}
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="mx-auto max-w-[680px] px-6 pt-14">
      <TopProgress />
      <div className={`${bar} h-10 w-full`} /><div className={`${bar} mt-3 h-10 w-3/4`} />
      <div className="mt-8 flex items-center gap-3"><div className={`${bar} h-11 w-11 rounded-full`} /><div className={`${bar} h-4 w-40`} /></div>
      <div className={`${bar} mt-10 aspect-[16/9] w-full`} />
      <div className="mt-10 space-y-4">{[0, 1, 2, 3, 4].map(i => <div key={i} className={`${bar} h-4 ${i % 2 ? 'w-11/12' : 'w-full'}`} />)}</div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <>
      <TopProgress />
      <div className="h-16 border-b border-[#f2f2f2] bg-white" />
      <div className="px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-[1100px]">
          <div className={`${bar} h-7 w-48`} />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(i => <div key={i} className={`${bar} h-28 rounded-2xl`} />)}</div>
          <div className={`${bar} mt-6 h-64 rounded-2xl`} />
        </div>
      </div>
    </>
  );
}

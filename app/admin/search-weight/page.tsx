export default function SearchWeightAdminPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="panel p-7">
        <h1 className="text-3xl font-black text-[#131b2e]">Admin: Search Weight Guide</h1>
        <p className="mt-2 text-sm text-slate-600">
          정적 모드에서는 검색 가중치를 API로 저장하지 않습니다. 코드 상수로 관리합니다.
        </p>
      </header>

      <article className="panel space-y-4 p-6">
        <h2 className="text-lg font-bold text-[#131b2e]">가중치 수정 위치</h2>
        <p className="text-sm text-slate-700">
          <code>lib/search-ranking.ts</code>의 <code>DEFAULT_WEIGHTS</code> 값을 수정하세요.
        </p>
      </article>

      <article className="panel space-y-4 p-6">
        <h2 className="text-lg font-bold text-[#131b2e]">반영 방법</h2>
        <p className="text-sm text-slate-700">
          가중치 수정 후 빌드하면 정적 검색 로직에 반영됩니다.
        </p>
        <pre className="overflow-x-auto rounded-[2px] border-2 border-[#d3dbe9] bg-[#f8fafc] p-4 text-xs text-slate-700">
{`npm run build`}
        </pre>
      </article>
    </section>
  );
}

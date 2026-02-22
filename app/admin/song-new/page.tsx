export default function SongNewAdminPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <header className="panel p-7">
        <h1 className="text-3xl font-black text-[#131b2e]">Admin: Static Lyrics Guide</h1>
        <p className="mt-2 text-sm text-slate-600">
          이 프로젝트는 정적 사이트입니다. 곡 등록은 DB가 아니라 <code>data/lyrics</code> 파일을 통해 관리합니다.
        </p>
      </header>

      <article className="panel space-y-4 p-6">
        <h2 className="text-lg font-bold text-[#131b2e]">1) 파일 위치</h2>
        <p className="text-sm text-slate-700">
          원본 가사 파일은 <code>data/lyrics</code> 폴더에 <code>.txt</code>로 저장합니다.
        </p>
      </article>

      <article className="panel space-y-4 p-6">
        <h2 className="text-lg font-bold text-[#131b2e]">2) 파일명 규칙</h2>
        <p className="text-sm text-slate-700">
          형식: <code>아티스트_곡제목.txt</code> (첫 번째 <code>_</code> 기준 분리)
        </p>
        <p className="text-sm text-slate-700">예시: <code>마커스_입례.txt</code></p>
      </article>

      <article className="panel space-y-4 p-6">
        <h2 className="text-lg font-bold text-[#131b2e]">3) 본문 규칙</h2>
        <p className="text-sm text-slate-700">
          빈 줄 한 줄 이상을 기준으로 슬라이드가 분리됩니다. 각 슬라이드는 1~2줄만 허용됩니다.
        </p>
        <pre className="overflow-x-auto rounded-[2px] border-2 border-[#d3dbe9] bg-[#f8fafc] p-4 text-xs text-slate-700">
{`이곳에 오셔서
이곳에 앉으소서

주님만 예배하리
주님만 찬양하리`}
        </pre>
      </article>

      <article className="panel space-y-4 p-6">
        <h2 className="text-lg font-bold text-[#131b2e]">4) 반영 절차</h2>
        <p className="text-sm text-slate-700">
          <code>npm run build</code> 실행 전 <code>prebuild</code>에서 자동으로 <code>public/data/songs.json</code>이 생성됩니다.
        </p>
        <p className="text-sm text-slate-700">
          개발 중 즉시 반영이 필요하면 <code>npm run songs:sync</code>를 직접 실행하세요.
        </p>
      </article>
    </section>
  );
}

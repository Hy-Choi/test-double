import Link from "next/link";

export default function NotFoundPage() {
  return (
    <section className="panel mx-auto mt-16 max-w-xl p-8 text-center">
      <h1 className="text-2xl font-bold text-[#131b2e]">페이지를 찾을 수 없습니다</h1>
      <p className="mt-3 text-slate-600">요청하신 페이지가 없거나 이동되었습니다.</p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        홈으로 이동
      </Link>
    </section>
  );
}

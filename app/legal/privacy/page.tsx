import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0A0807] px-6 py-8 text-white">
      <Link href="/" className="text-[13px] text-white/55 underline underline-offset-4">
        Вернуться в приложение
      </Link>
      <section className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
        <p className="mb-4 text-[12px] uppercase tracking-[0.2em] text-white/45">KTS Beauty</p>
        <h1 className="font-editorial text-[34px] leading-none">Политика обработки данных</h1>
        <p className="mt-5 text-[15px] leading-relaxed text-white/62">
          Это страница-заглушка для будущего юридического документа. Здесь будет описано, какие данные используются для подбора ухода, как они хранятся и как пользователь может управлять ими.
        </p>
      </section>
    </main>
  );
}

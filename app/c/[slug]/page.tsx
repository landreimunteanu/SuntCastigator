import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getPublicCampaign, type CampaignState } from "@/lib/public/campaign";
import EntryForm from "@/components/EntryForm";

export const dynamic = "force-dynamic";

const STATE_MESSAGES: Record<
  Exclude<CampaignState, "active">,
  { title: string; body: string }
> = {
  not_started: {
    title: "Campania nu a început încă",
    body: "Revino mai târziu — înscrierile se deschid la data anunțată.",
  },
  ended: {
    title: "Campania s-a încheiat",
    body: "Perioada de înscriere s-a terminat. Îți mulțumim pentru interes.",
  },
  draft: {
    title: "Campania nu este activă",
    body: "Această campanie nu primește momentan înscrieri.",
  },
};

function formatEndDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function CampaignEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campaign = await getPublicCampaign(slug);
  if (!campaign) notFound();

  const endDateLabel = formatEndDate(campaign.endsAt);

  return (
    <main className="app-canvas min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6 flex items-center gap-3">
          {campaign.brand.logoUrl ? (
            <Image
              src={campaign.brand.logoUrl}
              alt={campaign.brand.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-md border border-neutral-200 bg-white object-contain p-1"
              unoptimized
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-neutral-900 text-lg text-white">
              🏆
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-xs uppercase tracking-wider text-neutral-500">
              {campaign.brand.name}
            </p>
            <h1 className="truncate text-lg font-semibold text-neutral-900">
              Câștigă cu {campaign.brand.name}!
            </h1>
          </div>
        </header>

        {campaign.heroImageUrl && (
          <div className="mb-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <Image
              src={campaign.heroImageUrl}
              alt=""
              width={800}
              height={400}
              className="h-auto w-full object-cover"
              unoptimized
              priority
            />
          </div>
        )}

        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-semibold text-neutral-900">
            {campaign.name}
          </h2>
          {campaign.howToText && (
            <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">
              {campaign.howToText}
            </p>
          )}
          {endDateLabel && campaign.state === "active" && (
            <p className="mt-3 text-xs uppercase tracking-wider text-neutral-500">
              Se încheie pe {endDateLabel}
            </p>
          )}

          <div className="mt-5">
            {campaign.state === "active" ? (
              <EntryForm
                campaignId={campaign.id}
                codeRegex={campaign.codeRegex}
                rulesPdfUrl={campaign.rulesPdfUrl}
                brandName={campaign.brand.name}
              />
            ) : (
              <InactiveNotice state={campaign.state} />
            )}
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-neutral-500">
          {campaign.rulesPdfUrl && (
            <a
              href={campaign.rulesPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-neutral-900"
            >
              Regulament oficial
            </a>
          )}
          <Link
            href="/termeni"
            className="underline underline-offset-2 hover:text-neutral-900"
          >
            Termeni și condiții
          </Link>
          <Link
            href="/confidentialitate"
            className="underline underline-offset-2 hover:text-neutral-900"
          >
            Confidențialitate
          </Link>
        </footer>
      </div>
    </main>
  );
}

function InactiveNotice({ state }: { state: Exclude<CampaignState, "active"> }) {
  const msg = STATE_MESSAGES[state];
  return (
    <div
      role="status"
      className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm"
    >
      <p className="font-semibold text-amber-900">{msg.title}</p>
      <p className="mt-0.5 text-amber-800">{msg.body}</p>
    </div>
  );
}

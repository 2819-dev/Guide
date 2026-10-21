import { GuideBrandBanner } from "@/components/guide-brand-banner";
import { MeetingRequestForm } from "@/components/meeting-request-form";

export const runtime = "edge";

export const metadata = {
  title: "Book a meeting · Guide",
  description: "Request a Guide walkthrough for your school or district.",
};

export default function BookMeetingPage() {
  return (
    <div className="portal-page">
      <GuideBrandBanner variant="strip" priority />
      <div className="content-band portal-page__inner max-w-2xl">
        <MeetingRequestForm />
      </div>
    </div>
  );
}

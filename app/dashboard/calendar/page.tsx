import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function Page() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Calendar</h1>
        <p className="text-sm text-ink-soft">Viewings, meetings, and follow-ups.</p>
      </div>
      <Card className="flex flex-col items-center justify-center gap-2 p-16 text-center">
        <Calendar className="text-ink-soft" size={28} />
        <p className="text-sm font-medium text-ink">Coming in the next build</p>
        <p className="max-w-sm text-sm text-ink-soft">
          Customers is live first so leads have somewhere to go. This module
          follows next, feature-by-feature, same as Customers did.
        </p>
      </Card>
    </div>
  );
}

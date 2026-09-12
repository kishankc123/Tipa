"use client";

import { useState } from "react";
import { Lightbulb, Mail } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage } from "@/lib/api";

export default function ContactUsPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    try {
      await submitContactMessage({ subject, message });
      setSubject("");
      setMessage("");
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <SiteHeader title="Contact Us" description="We're here to help" />
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">Contact Us</p>
                <p className="text-xs text-muted-foreground">
                  Need help? Send us a message and our team will get back to
                  you within 24 hrs.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium">Send a Message</p>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What is this about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us more about your request"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              {sent ? (
                <p className="text-xs text-primary">
                  Message sent — we&apos;ll get back to you within 24 hrs.
                </p>
              ) : null}
              <Button
                className="w-full"
                onClick={handleSend}
                disabled={!subject.trim() || !message.trim() || sending}
              >
                {sending ? "Sending..." : "Send Message"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You can mail us at{" "}
                <a
                  href="mailto:info.tipa2026@gmail.com"
                  className="font-medium text-foreground"
                >
                  info.tipa2026@gmail.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
              <Lightbulb className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Quick Tip</p>
              <p className="text-xs text-muted-foreground">
                Explain the whole issue in as much detail as possible, so our
                team can resolve your issue faster.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

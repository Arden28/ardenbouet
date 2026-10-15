import * as React from 'react';
import { Html, Head, Body, Container, Section, Heading, Text, Button, Link, Hr, Preview, Img } from '@react-email/components';

const ACCENT = '#1a8917';
const DARK = '#242424';
const MUTED = '#6b6b6b';
const FAINT = '#f2f2f2';
const SERIF = "Georgia, Cambria, 'Times New Roman', serif";
const SANS = "system-ui, -apple-system, 'Segoe UI', sans-serif";

function Shell({ preview, children, unsubscribeUrl }: { preview: string; children: React.ReactNode; unsubscribeUrl?: string }) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: FAINT, margin: 0, padding: 0, fontFamily: SANS }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>
          <Section style={{ backgroundColor: '#fff', padding: '32px', borderRadius: 8 }}>
            <Text style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: DARK, margin: '0 0 24px' }}>
              Arden BOUET
            </Text>
            {children}
          </Section>
          <Text style={{ color: MUTED, fontSize: 12, textAlign: 'center' as const, margin: '16px 0 0' }}>
            You are receiving this because you subscribed on ardenbouet.me.
            {unsubscribeUrl && (
              <>
                {' '}
                <Link href={unsubscribeUrl} style={{ color: MUTED, textDecoration: 'underline' }}>Unsubscribe</Link>
              </>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function ConfirmSubscriptionEmail({ confirmUrl }: { confirmUrl: string }) {
  return (
    <Shell preview="Confirm your subscription">
      <Heading style={{ fontFamily: SERIF, fontSize: 26, color: DARK, margin: '0 0 12px' }}>Confirm your subscription</Heading>
      <Text style={{ fontSize: 16, lineHeight: 1.6, color: DARK }}>
        Thanks for subscribing! Confirm your email to get new stories in your inbox as soon as they are published.
      </Text>
      <Button href={confirmUrl} style={{ backgroundColor: ACCENT, color: '#fff', borderRadius: 999, padding: '12px 22px', fontSize: 15 }}>
        Confirm subscription
      </Button>
      <Text style={{ fontSize: 13, color: MUTED, marginTop: 24 }}>If you didn’t request this, you can ignore this email.</Text>
    </Shell>
  );
}

export function NewPostEmail(props: {
  title: string;
  subtitle: string;
  coverUrl?: string | null;
  url: string;
  readingMinutes: number;
  unsubscribeUrl: string;
}) {
  return (
    <Shell preview={props.subtitle || props.title} unsubscribeUrl={props.unsubscribeUrl}>
      <Text style={{ fontSize: 13, color: MUTED, margin: '0 0 8px' }}>New story · {props.readingMinutes} min read</Text>
      {props.coverUrl && <Img src={props.coverUrl} alt="" width="536" style={{ width: '100%', borderRadius: 4, margin: '0 0 20px' }} />}
      <Heading style={{ fontFamily: SERIF, fontSize: 28, lineHeight: 1.2, color: DARK, margin: '0 0 10px' }}>{props.title}</Heading>
      {props.subtitle && <Text style={{ fontFamily: SERIF, fontSize: 18, lineHeight: 1.5, color: MUTED, margin: '0 0 24px' }}>{props.subtitle}</Text>}
      <Button href={props.url} style={{ backgroundColor: DARK, color: '#fff', borderRadius: 999, padding: '12px 22px', fontSize: 15 }}>
        Read the story
      </Button>
      <Hr style={{ borderColor: FAINT, margin: '28px 0 0' }} />
    </Shell>
  );
}

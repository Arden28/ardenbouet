import * as React from 'react';
import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Button, Link, Hr, Preview,
} from '@react-email/components';

const ACCENT  = '#2467AC';
const DARK    = '#09090b';
const MID     = '#3f3f46';
const MUTED   = '#71717a';
const FAINT   = '#f4f4f5';
const WHITE   = '#ffffff';
const MONO    = "'Courier New', Courier, monospace";
const SANS    = "system-ui, -apple-system, sans-serif";

export interface PurchaseEmailProps {
  customerName: string;
  customerEmail: string;
  productTitle: string;
  amount: number;
  currency: string;
  paymentRef: string;
  isService: boolean;
  downloadToken: string | null;
  siteUrl?: string;
}

export default function PurchaseEmail({
  customerName,
  customerEmail,
  productTitle,
  amount,
  currency,
  paymentRef,
  isService,
  downloadToken,
  siteUrl = 'https://ardenbouet.me',
}: PurchaseEmailProps) {
  const downloadUrl = downloadToken ? `${siteUrl}/download/${downloadToken}` : null;
  const subject     = isService
    ? `Booking confirmed — ${productTitle}`
    : `Your download is ready — ${productTitle}`;

  return (
    <Html lang="en">
      <Head />
      <Preview>{subject}</Preview>

      <Body style={{ backgroundColor: FAINT, margin: 0, padding: 0, fontFamily: SANS }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '32px 16px' }}>

          {/* ── HEADER ─────────────────────────────────────────────── */}
          <Section style={{
            backgroundColor: DARK,
            borderLeft: `4px solid ${ACCENT}`,
            padding: '28px 32px',
          }}>
            {/* Brand */}
            <Text style={{
              fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em',
              textTransform: 'uppercase' as const, color: MUTED, margin: '0 0 6px',
            }}>
              ARDEN BOUET · SHOP
            </Text>

            <Heading style={{
              fontSize: 26, fontWeight: 900, color: WHITE,
              letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1,
            }}>
              {isService ? 'Booking Confirmed.' : 'Payment Confirmed.'}
            </Heading>

            <Text style={{ color: MUTED, fontSize: 14, margin: '10px 0 0', lineHeight: 1.5 }}>
              Hi <strong style={{ color: '#d4d4d8' }}>{customerName}</strong> —{' '}
              {isService
                ? "we'll be in touch within 24 hours to schedule your session."
                : 'your download is ready below. Save it somewhere safe.'}
            </Text>
          </Section>

          {/* ── ORDER DETAILS ──────────────────────────────────────── */}
          <Section style={{ backgroundColor: WHITE, padding: '24px 32px' }}>
            <Text style={{
              fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em',
              textTransform: 'uppercase' as const, color: MUTED, margin: '0 0 18px',
            }}>
              Order Details
            </Text>

            {/* Product */}
            <Row>
              <Column>
                <Text style={{
                  fontFamily: MONO, fontSize: 10, color: '#a1a1aa',
                  textTransform: 'uppercase' as const, letterSpacing: '0.12em', margin: 0,
                }}>
                  Product
                </Text>
                <Text style={{ color: DARK, fontSize: 16, fontWeight: 700, margin: '4px 0 0' }}>
                  {productTitle}
                </Text>
              </Column>
            </Row>

            <Hr style={{ borderColor: FAINT, margin: '16px 0' }} />

            {/* Amount + Ref */}
            <Row>
              <Column style={{ width: '50%', paddingRight: 16 }}>
                <Text style={{
                  fontFamily: MONO, fontSize: 10, color: '#a1a1aa',
                  textTransform: 'uppercase' as const, letterSpacing: '0.12em', margin: 0,
                }}>
                  Amount Paid
                </Text>
                <Text style={{
                  fontFamily: MONO, fontSize: 22, fontWeight: 900,
                  color: DARK, margin: '4px 0 0',
                }}>
                  {currency} {amount.toFixed(2)}
                </Text>
              </Column>
              <Column style={{ width: '50%' }}>
                <Text style={{
                  fontFamily: MONO, fontSize: 10, color: '#a1a1aa',
                  textTransform: 'uppercase' as const, letterSpacing: '0.12em', margin: 0,
                }}>
                  Payment Ref
                </Text>
                <Text style={{
                  fontFamily: MONO, fontSize: 10, color: MUTED,
                  margin: '4px 0 0', wordBreak: 'break-all' as const, lineHeight: 1.5,
                }}>
                  {paymentRef}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* ── DOWNLOAD / SERVICE SECTION ─────────────────────────── */}
          {isService ? (
            /* Service: next steps */
            <Section style={{
              backgroundColor: '#eff6ff',
              borderLeft: `4px solid ${ACCENT}`,
              padding: '20px 32px',
            }}>
              <Text style={{
                fontFamily: MONO, fontSize: 9, color: ACCENT,
                textTransform: 'uppercase' as const, letterSpacing: '0.2em', margin: '0 0 10px',
              }}>
                What Happens Next
              </Text>
              <Text style={{ color: '#1e40af', fontSize: 14, lineHeight: 1.65, margin: 0 }}>
                We'll review your booking and reach out to{' '}
                <strong>{customerEmail}</strong> within{' '}
                <strong>24 hours</strong> to schedule your session and discuss details.
              </Text>
              <Button
                href={`mailto:laudbouetoumoussa@gmail.com?subject=Re%3A%20${encodeURIComponent(productTitle)}`}
                style={{
                  backgroundColor: ACCENT, color: WHITE,
                  fontFamily: MONO, fontSize: 11,
                  textTransform: 'uppercase' as const, letterSpacing: '0.15em',
                  padding: '12px 24px', display: 'inline-block',
                  marginTop: 16, textDecoration: 'none',
                }}
              >
                Reply to this booking →
              </Button>
            </Section>
          ) : downloadUrl ? (
            /* Digital: download CTA */
            <Section style={{
              backgroundColor: WHITE,
              borderTop: `1px solid ${FAINT}`,
              padding: '24px 32px',
            }}>
              <Text style={{
                fontFamily: MONO, fontSize: 9, letterSpacing: '0.22em',
                textTransform: 'uppercase' as const, color: MUTED, margin: '0 0 10px',
              }}>
                Your Download
              </Text>
              <Text style={{ color: MID, fontSize: 14, lineHeight: 1.65, margin: '0 0 22px' }}>
                Click the button to access your file. The link is valid for{' '}
                <strong style={{ color: DARK }}>48 hours</strong> and can be used up to{' '}
                <strong style={{ color: DARK }}>3 times</strong>.
              </Text>

              <Button
                href={downloadUrl}
                style={{
                  backgroundColor: DARK, color: WHITE,
                  fontFamily: MONO, fontSize: 12,
                  textTransform: 'uppercase' as const, letterSpacing: '0.15em',
                  padding: '16px 36px', display: 'inline-block',
                  textDecoration: 'none',
                }}
              >
                Download {productTitle} →
              </Button>

              <Hr style={{ borderColor: FAINT, margin: '20px 0 12px' }} />

              <Text style={{
                fontFamily: MONO, fontSize: 9, color: '#a1a1aa',
                textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: 0,
              }}>
                Or paste this link in your browser:
              </Text>
              <Text style={{
                fontFamily: MONO, fontSize: 10, color: ACCENT,
                margin: '4px 0 0', wordBreak: 'break-all' as const,
              }}>
                <Link href={downloadUrl} style={{ color: ACCENT, textDecoration: 'underline' }}>
                  {downloadUrl}
                </Link>
              </Text>
            </Section>
          ) : (
            /* Digital but no file set yet */
            <Section style={{
              backgroundColor: '#fafafa',
              borderTop: `1px solid ${FAINT}`,
              padding: '20px 32px',
            }}>
              <Text style={{ color: MID, fontSize: 14, margin: 0 }}>
                Your files will be delivered to{' '}
                <strong>{customerEmail}</strong> shortly. If you don't
                receive them within 24 hours, please contact us.
              </Text>
            </Section>
          )}

          {/* ── SECURITY BADGE ─────────────────────────────────────── */}
          <Section style={{
            backgroundColor: '#fafafa',
            borderTop: `1px solid ${FAINT}`,
            padding: '12px 32px',
          }}>
            <Row>
              <Column>
                <Text style={{
                  fontFamily: MONO, fontSize: 9, color: '#a1a1aa',
                  textTransform: 'uppercase' as const, letterSpacing: '0.12em', margin: 0,
                }}>
                  🔒 Secure checkout · Payment processed by your selected provider
                </Text>
              </Column>
            </Row>
          </Section>

          {/* ── FOOTER ─────────────────────────────────────────────── */}
          <Section style={{ backgroundColor: DARK, padding: '20px 32px' }}>
            <Text style={{
              fontFamily: MONO, fontSize: 9, color: MUTED,
              textTransform: 'uppercase' as const, letterSpacing: '0.15em', margin: '0 0 8px',
            }}>
              Arden BOUET
            </Text>
            <Text style={{ color: '#52525b', fontSize: 12, margin: 0, lineHeight: 1.6 }}>
              Questions about your purchase? Reply to this email or write to{' '}
              <Link
                href="mailto:laudbouetoumoussa@gmail.com"
                style={{ color: ACCENT, textDecoration: 'underline' }}
              >
                laudbouetoumoussa@gmail.com
              </Link>
            </Text>
            <Text style={{
              fontFamily: MONO, fontSize: 9, color: '#3f3f46',
              margin: '14px 0 0',
            }}>
              © {new Date().getFullYear()} Arden BOUET · All purchases are final.
              <br />This email was sent to {customerEmail}.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

# Group invitation bookings — technical spec (pending)

Status: **not implemented**. Do not ship unpaid seat holds or fake invite checkouts until this is built.

## Goal

Allow one host to create a named group for an event, share an invite link, and let each invitee pay for their own ticket(s). Places count as secured only after payment.

## Data model

### `booking_groups`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `event_id` | uuid FK → events | |
| `host_customer_id` | uuid FK → customers (nullable until host pays) | |
| `host_email` | text | Required at create |
| `name` | text nullable | Optional table/group name |
| `invite_token` | text unique | Opaque, URL-safe |
| `target_seats` | int | Desired group size (informational) |
| `created_at` | timestamptz | |
| `expires_at` | timestamptz nullable | Only if soft-hold is enabled |

### `bookings` extension

| Column | Type | Notes |
|--------|------|--------|
| `group_id` | uuid nullable FK → booking_groups | Attach paid bookings to a group |

No unpaid reservation rows unless soft-hold (below) is explicitly enabled.

## API

### `POST /api/groups`

Create group for an event.

Request: `{ eventId, hostEmail, name?, targetSeats? }`  
Response: `{ groupId, inviteToken, inviteUrl }`

Does **not** decrement capacity. Fires analytics `group_invitation_started`.

### `GET /api/groups/:token`

Public invite page data:

- Event summary
- Group name
- `securedSeats` = sum of paid booking seats with this `group_id`
- `remainingHint` = `targetSeats - securedSeats` (soft; capacity still global)

### `POST /api/checkout` (extend)

Accept optional `groupInviteToken`. After session create / fulfill, set `bookings.group_id`.

Existing capacity checks at session create + fulfill remain authoritative.

## Reservation / expiration rules

**Default (recommended v1):** no unpaid holds. Invite link is a deep link into checkout with group context. Spots are first-come, first-paid against event capacity.

**Optional v2 soft-hold:** only if ops requires it:

1. Hold N unpaid seats for `expires_at` (e.g. 30–60 min)
2. Cron/job releases expired holds
3. Capacity = `spots_sold + active_holds`
4. Never confirm seating in UI until payment

Without TTL + release + concurrency locks, do not advertise reserved unpaid places.

## Payment logic

- Each member pays their own Stripe Checkout session (full payment, current mode)
- Host may also buy 1+ seats via the same invite token
- No split payment within one Stripe session in v1
- Flat per-person price applies (same as current booking tiers)

## Invitation-link behavior

- URL shape: `/{locale}/agenda/{slug}?group={token}` or `/{locale}/g/{token}`
- Landing shows secured count + CTA to book into the group
- Share via WhatsApp / copy link (client-only; analytics `group_invitation_shared`)
- Do not auto-message guests

## Capacity & concurrency

Reuse current pattern:

1. Reject checkout if `seats > capacity - spots_sold`
2. On fulfill, atomic increment of `spots_sold` with capacity guard
3. Group membership is metadata only; it does not bypass capacity

## Analytics (already named in product)

- `group_invitation_started`
- `group_invitation_shared`
- Enrich `checkout_started` / `payment_completed` with `group_id`, `ticket_quantity`, `is_multi_ticket`

## UI notes

Until backend ships: **omit** invite CTAs from booking UI (no “coming soon” dead ends). Homepage `NextTableConversion` may share the agenda link only.

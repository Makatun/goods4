# Domain model overview

> Summary of the data model. The authoritative rules are in [`../spec.md`](../spec.md); rule IDs
> in brackets (e.g. `DET-7`) point there. When this file and the spec disagree, the spec wins.

## The idea

Goods lets groups of people review anything (example: *Wine*).

- A **List** is a community around one subject. It defines **Details**, which come in two kinds:
  - **Facts** describe what an Item *is* (Producer, Vintage). Each Item has one shared value per Fact.
  - **Opinions** are questions every member answers privately (Taste, Price paid).
- Members (**Contributors**) add **Items**. Each Item is identified by its Facts, and its name is
  generated from a template (`{Producer} {Vintage}`).
- Each member gives an Item a **Review** label and answers the Opinions they've chosen for their own view.
- Everyone sees **aggregates** (the most popular answer). Answers with overwhelming agreement are
  frozen as a **ConsensusValue**.
- Individual answers, personal views and personalizations are never visible to anyone else.

## Roles

| Status | Access |
|---|---|
| `PENDING`, `REJECTED`, `BANNED` | List statistics only |
| `MEMBER` | Full List |
| `ADMIN` | Full List + moderation; ranked by `adminSince` (seniority) |

There is no OWNER. The creator is the first ADMIN. An ADMIN can ban or demote only ADMINs junior to
them. If the last ADMIN leaves, the longest-tenured MEMBER is promoted. A List is deleted when its
last Contributor leaves. [`MOD-*`, `LEAVE-*`]

## Entities

| Model | Key fields | Belongs to / unique per | Deleted when |
|---|---|---|---|
| `User` | `username`, `appTermsAcceptedVersion`, `ageConfirmedAt`, `suspended`, `suspensionReason` | — / `username` | the User deletes the account — immediate and complete [`ACC-3`, `ACC-4`] |
| `List` | `name`, admission mode, age/terms filters, `terms` + `termsVersion`, `unlisted`, name template | — | its sole Contributor deletes it, or the last Contributor leaves [`LIST-3`, `LEAVE-6`] |
| `Contributor` | `status`, `joinedAt`, `adminSince`, `ageConfirmed`, `termsAcceptedVersion`, `invitedBy`, `screenConfig` | User + List / (User, List) | leaving; User or List deleted. A ban keeps the record and hides its data, which is purged after 1 year [`MOD-2a`] |
| `InviteLink` | code | Contributor / one per member | regenerated; member leaves or is banned [`JOIN-1a`] |
| `Detail` | `kind` (`FACT` \| `OPINION`), `type`, `name`, `min`/`max`/`step`, `private` (Opinion), `required` (Fact), `default` (Opinion), `archived`, `selectedDetailCount`, `upForDeletionDate` | List | Opinion: creator while mutable, or auto-cleanup 7 days after its last SelectedDetail goes [`DET-7..14`]. Fact: never [`FACT-4`] |
| `Option` | `name`, `position`, `archived` | Detail | with its Detail; freely editable while the Detail is unused, frozen once in use (archive/remap instead) [`DET-6`, `ARC-5`] |
| `SelectedDetail` | `position`, `private`, label display | Contributor + Opinion / (Contributor, Detail) | owner deletes it — also deletes their Values and personalizations for it [`SEL-4`] |
| `Item` | generated `name`, `searchText`, one optional photo (+ uploader), `archived` | List / uniqueness key = values of required, non-archived Facts [`UNIQ-1`] | Review count reaches 0 [`ITEM-6`]; creator, if sole reviewer [`ITEM-2`] |
| `FactValue` | answer per type (incl. Options) | Item + Fact / (Item, Fact) | with its Item; fill/edit rules in [`FVAL-3`] |
| `Review` | `label`: `FAVORITE` \| `GOOD` \| `OK` \| `BAD` \| `WISH_TO_TRY` | Contributor + Item / (Contributor, Item) | creator; required before answering Opinions, and an Item's creator must review it [`REV-*`] |
| `Value` | answer per type (incl. Options) | Review + SelectedDetail / (Review, Detail) | its Review or SelectedDetail is deleted |
| `ConsensusValue` | frozen most-popular answer | Item + Opinion / (Item, Detail) | conditions no longer hold (daily job), or Item/Detail deleted [`AGG-4..7`] |
| `OptionPersonalization` | `sentiment` 1–5, `disabled`, `position` | Contributor + Option (Fact or Opinion) | Option or Contributor deleted; moved or dropped on remap [`PER-1`, `ARC-5`] |
| `ValuePersonalization` | `sentiment` 1–5 | Contributor + Value | Value or Contributor deleted; none for FactValues [`PER-2`] |
| `Report` | reported object, reason, outcome | reporting User | 1 year after resolution, or the reporter deletes their account [`UGC-1`] |
| `Block` | — | blocker + blocked User / pair | blocker removes it; either User deleted [`UGC-3`] |

All objects carry `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`. On surviving objects, `*By`
references to a departed Contributor become a "deleted contributor" placeholder. [`AUD-1`, `LEAVE-4`]

## Detail types

| Type | Value | Aggregate match |
|---|---|---|
| `singleSelect` | exactly one Option | same Option |
| `tags` | zero to many Options | each Option counted separately |
| `number` | one number, within optional `min`/`max`/`step` | exact number |
| `text` | one text | case- and whitespace-insensitive |
| `date` | one date | same date |
| `location` | `placeId`, display name, lat/long | same `placeId` |

## Privacy and aggregates

- Members see aggregates and answer counts, never anyone else's Reviews, Values, SelectedDetails or
  personalizations. [`PRIV-1`]
- Aggregate = the most popular answer, computed live. A tie shows no aggregate. [`AGG-1..3`]
- **ConsensusValue**: more than 10 answers, with more than 90% choosing the same answer. Re-checked
  daily. [`AGG-4`, `AGG-5`]
- **Private** answers never appear in counts. They affect the winning answer only when the
  (Item, Detail) has more than 5 answers. Banned users' answers don't count. [`PRIV-2`, `PRIV-3`]
- Items store no aggregates.

## Lifecycle highlights

- **Leaving a List** deletes everything the Contributor created there, except shared content:
  Opinions others selected, Facts, Options on surviving Details, and Items others reviewed. [`LEAVE-3`]
- **Archiving** (Items, Facts, Options, Opinions) replaces deletion wherever others depend on the
  data. Bad Options are fixed by **remapping** them to a correct Option. [§5.5]
- **Account deletion**, **data export**, **reports**, **blocks**, **suspension** and the **text
  filter** are covered in spec §12.

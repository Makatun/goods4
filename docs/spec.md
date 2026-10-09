# Goods — Product & Data Specification

> Refined from the original draft; a condensed data-model summary lives in
> [`datamodel/datamodel_specs.md`](datamodel/datamodel_specs.md). This file is authoritative.
> Rule IDs (e.g. `DET-3`) are stable references for tickets, tests and code comments. Retired IDs
> are kept as *removed* entries and never reused.
> Legal and app-store obligations (account deletion, data rights, user-generated content) are in
> [§12](#12-accounts-data-rights-and-compliance).
> Decisions taken while refining are logged in [§13](#13-decision-log); remaining gaps are in
> [§14](#14-open-questions).

---

## 1. Purpose

Goods lets groups of people review **anything**. A **List** defines a subject (e.g. *Wine*) and a
configurable set of **Details**. A Detail is either a **Fact** — a shared attribute that identifies
an Item (e.g. *producer*, *vintage*) — or an **Opinion** question each member answers privately
(e.g. *taste*, *price paid*). Members (**Contributors**) add **Items** (e.g. a specific bottle)
described by their Facts, give each one a **Review** label, and answer Opinions. Each
Contributor tailors their own view of the List and keeps their individual answers private; everyone
sees the **aggregate** (most popular) answers, and answers with overwhelming agreement are frozen as
**consensus** and shown as the default for anyone who hasn't answered.

## 2. Glossary

| Term | Meaning |
|---|---|
| **User** | An account. Holds `username`, `appTermsAcceptedVersion` and `suspended` (§12). |
| **List** | A reviewing community around one subject (e.g. *Wine*). |
| **Contributor** | A User's membership in one List, with a status. |
| **Detail** | A List-level attribute definition (name, kind, type, options, range). |
| **Fact** | A Detail of kind `FACT`: one shared value per Item, describing what the Item *is*. |
| **Opinion** | A Detail of kind `OPINION`: each Contributor answers it privately per Item. |
| **Option** | A predefined choice of a `singleSelect` or `tags` Detail. |
| **FactValue** | The shared value of one Fact for one Item. |
| **Name template** | List-level pattern that generates every Item's `name` from its FactValues. |
| **SelectedDetail** | A Contributor's adoption of an Opinion into their own view, with personal display settings. |
| **Item** | A thing being reviewed within a List (e.g. one specific wine). |
| **Review** | One Contributor's verdict on one Item: a required label plus Values. |
| **Value** | One Contributor's answer to one Opinion for one Item. |
| **Aggregate value** | The most popular answer to an Opinion for an Item, computed on the fly. |
| **ConsensusValue** | A stored aggregate with overwhelming agreement (`AGG-4`); no longer computed live. |
| **OptionPersonalization** | A Contributor's private tweak of an Option (sentiment, disabled, position). |
| **ValuePersonalization** | A Contributor's private sentiment about a Value. |
| **Sentiment** | Integer 1–5 expressing a Contributor's opinion: 1 = bad, 5 = good. |
| **Active member** | A Contributor whose status is `MEMBER` or `ADMIN`. |
| **Archived** | Retired from pickers, search and new use, but kept and still displayed where already used (§5.5, `ITEM-3`). |
| **Seniority** | Ordering of ADMINs by `adminSince`; earlier = more senior (`MOD-5`). |

## 3. Roles and membership

### 3.1 Contributor status

| Status | Meaning | List access |
|---|---|---|
| `PENDING` | Applied, awaiting approval | Stats only |
| `REJECTED` | Application declined; may re-apply | Stats only |
| `BANNED` | Blocked by an admin; data hidden (`MOD-2a`) | Stats only |
| `MEMBER` | Regular participant | Full |
| `ADMIN` | Moderator, ranked by seniority | Full + admin actions |

There is no `OWNER` role (decision 39).

- `MEM-1` Only active members (`MEMBER`/`ADMIN`) may see or change anything inside a List.
- `MEM-2` Everyone else (non-members and `PENDING`/`REJECTED`/`BANNED`) sees only the List's
  statistics: number of contributors, non-archived items and reviews.
- `MEM-3` There is at most one Contributor per (User, List).
- `MEM-4` *(removed — no OWNER role, decision 39)*
- `MEM-5` A Contributor has a private `screenConfig` JSON field holding their saved screen state
  (filters, sort, view mode, shown Facts — `NAME-6`).
- `MEM-6` A Contributor stores `joinedAt` (became an active member) and, while `ADMIN`,
  `adminSince` (latest promotion to `ADMIN`).

### 3.2 Discovering and joining a List

- `JOIN-1` Lists are discoverable by name through public search (showing stats only) and through
  invite links. Admins may mark a List **unlisted**, which removes it from search; invite links
  still work.
- `JOIN-1a` Every active member has their own permanent invite link for the List, which they may
  regenerate (revoking the old one). A link stops working when its member leaves or is banned.
  Joining via a link follows the normal admission mode and qualification filters; the new
  Contributor records `invitedBy`.
- `JOIN-2` A User applies to a List, which creates a `PENDING` Contributor.
- `JOIN-3` Admission mode is configured per List by its admins:
  - **Automatic** — the applicant becomes `MEMBER` immediately.
  - **Approval** — an `ADMIN` moves the applicant to `MEMBER` or `REJECTED`.
- `JOIN-4` Qualification filters are hardcoded and individually enabled/disabled by admins:
  - **Age** — "Are you over 21?" → boolean stored on Contributor.
  - **Terms** — "Do you accept the terms and conditions?" → stored on Contributor as
    `termsAcceptedVersion`. The terms text is an editable string on the List (`terms`, with a
    `termsVersion` incremented on every edit), edited on the List edit screen.
- `JOIN-5` A `REJECTED` User may re-apply, which returns them to `PENDING`.
- `JOIN-6` A `BANNED` User cannot re-apply until an `ADMIN` lifts the ban (`MOD-2`), which sets the
  status to `REJECTED` (so they may re-apply). If the ban is not lifted within a year, the data is
  purged (`MOD-2a`) but the `BANNED` record remains — until the User deletes their account, which
  removes it too (`ACC-4`).
- `JOIN-7` On becoming an active member, the Contributor receives a SelectedDetail for every
  **default** Detail of the List (see `SEL-5`).
- `JOIN-8` Qualification filters are enforced in the UI before applying, in both admission modes:
  no Contributor is created until every enabled filter passes. There is no "failed filter" state.
- `JOIN-9` When `terms` change, or when admins enable a filter that was off, every active member is
  shown a blocking prompt on their next visit and must accept/answer it before continuing. Their
  status does not change.
- `JOIN-10` Switching admission mode from Approval to Automatic admits all `PENDING` applicants as
  `MEMBER`.

### 3.3 Moderation and roles

- `MOD-1` `ADMIN`s approve or reject `PENDING` applicants.
- `MOD-2` An `ADMIN` may ban or unban a `MEMBER`, and may ban or unban an `ADMIN` who is junior to
  them (`MOD-5`).
- `MOD-2a` Banning keeps the Contributor's data but hides it: their Values are excluded from
  aggregates, answer counts and consensus (`AGG-8`), and they lose all access. Lifting the ban
  restores the data and its effect on aggregates. If the ban is not lifted within **one year**, the
  data is purged exactly like leaving (`LEAVE-3`, `LEAVE-4`); the Contributor record is kept with
  status `BANNED` to block re-applying (`JOIN-6`). The banned user is not notified, but may still
  download their data (`DATA-1`). If they delete their account, the retained data is purged
  immediately (`ACC-4`). Their Items and Details remain visible to others during the ban.
- `MOD-3` An `ADMIN` may promote a `MEMBER` to `ADMIN`, and may demote an `ADMIN` who is junior to
  them. An `ADMIN` may step down to `MEMBER` voluntarily. Re-promotion sets a new `adminSince`.
- `MOD-4` *(removed — no ownership transfer, decision 39)*
- `MOD-5` **Seniority**: an `ADMIN` is senior to every `ADMIN` with a later `adminSince`. The List's
  creator is its first `ADMIN` and therefore most senior until they leave, step down or are demoted.
- `MOD-6` If the last `ADMIN` leaves, steps down, is banned or is demoted while `MEMBER`s remain,
  the `MEMBER` with the earliest `joinedAt` is promoted to `ADMIN` automatically.

### 3.4 Leaving a List

- `LEAVE-1` A Contributor leaves by exiting the List and confirming deletion of their private data
  in that List. The Contributor record is then deleted.
- `LEAVE-2` Any Contributor, including any `ADMIN`, may leave at any time (`MOD-6` keeps the List
  moderated).
- `LEAVE-3` Everything the Contributor created in the List is deleted — Reviews, Values,
  SelectedDetails, personalizations, Opinions and their Options — **except**:
  - Opinions that still have SelectedDetails belonging to other Contributors;
  - Facts, which are never deleted (`FACT-4`);
  - Options added to a Detail that survives — Options belong to their Detail;
  - FactValues and photos on Items that survive.

  Items are deleted when their last Review is (`ITEM-6`), so an Item survives exactly when another
  Contributor has reviewed it. Surviving objects belong to the List, not to their creator.
- `LEAVE-4` Every `createdBy` / `modifiedBy` / `invitedBy` reference to the departed Contributor on
  surviving objects is replaced with a "deleted contributor" placeholder.
- `LEAVE-5` A Contributor is also deleted when its User or List is deleted. Deleting a User acts as
  leaving every List they belong to, in any status (`ACC-3`, `ACC-4`).
- `LEAVE-6` When the last Contributor leaves a List, the List is deleted.

## 4. Lists

- `LIST-1` A List has a name, admission settings (`JOIN-3`, `JOIN-4`), `terms`/`termsVersion`, an
  `unlisted` flag, a name template (`LIST-5`), and owns its Contributors, Items and Details.
- `LIST-2` The creator becomes its first `ADMIN` Contributor. Creating a List requires defining at
  least one **required** Fact (`FACT-5`).
- `LIST-3` A List may be deleted only by its sole Contributor. It is also deleted automatically when
  its last Contributor leaves (`LEAVE-6`).
- `LIST-4` Admins can mark Opinions as **default** for the List (`SEL-5`, `SEL-7`).
- `LIST-5` Admins define the List's **name template**, e.g. `{Producer} {Vintage}` (§7.3). It must
  reference at least one required, non-archived Fact. If none is defined, the default template is
  all required Facts in position order, separated by spaces.

## 5. Details

### 5.1 Definition

- `DET-1` Detail types and the Values / FactValues they accept:

  | Type | Value |
  |---|---|
  | `singleSelect` | exactly one Option |
  | `tags` | zero to many Options |
  | `number` | exactly one number |
  | `text` | exactly one text |
  | `date` | exactly one date |
  | `location` | exactly one place: `placeId`, display name, latitude/longitude |

- `DET-1a` Every Detail has a `kind`: `OPINION` (answered privately per Contributor through
  SelectedDetails and Values, §6, §8) or `FACT` (one shared FactValue per Item, §5.4, §7.2).
- `DET-2` A Detail belongs to a List and is visible to every active member of that List.
- `DET-3` Any active member may create Opinions. Only `ADMIN`s create Facts (`FACT-1`).
- `DET-4` An Opinion has a `private` flag, which is the default for the `private` field of
  SelectedDetails created from it. Facts have no `private` flag.
- `DET-5` A `number` Detail has optional `min`, `max` and `step`. When set, Values must satisfy
  them; a bounded Detail may render as a slider, an unbounded one as a numeric input.
- `DET-6` `singleSelect` and `tags` Details have Options, each with a name and position. **Any
  active member may add an Option to any Detail**, of either kind, at any time. While the Detail is
  unused (`DET-7`, `FACT-3`), its Options may be renamed and deleted freely, since no answer refers
  to them yet. Once it is in use (`DET-7a`), its Options can be neither renamed nor deleted — to fix
  one, add the correct Option and remap (`ARC-5`); they are then deleted only with their Detail.

### 5.2 Mutability of Opinions

An Opinion is **mutable** while no other Contributor depends on it.

- `DET-7` While mutable, only the Detail's creator may modify or delete it (including its Options).
- `DET-7a` While in use (immutable), the following changes remain allowed, by the creator or any
  `ADMIN`: widening the number range (lower `min`, higher `max`) and changing the `private` default
  (affects only SelectedDetails created later). Blocked: renaming the Detail, changing its type,
  changing `step`, narrowing the range, renaming or deleting Options. Mistakes are fixed by creating
  a new Detail and archiving the old one (`ARC-4`).
- `DET-8` A Detail with **no** SelectedDetails is mutable.
- `DET-9` A Detail with **any** SelectedDetail is immutable, with one exception: if its **only**
  SelectedDetail belongs to the Detail's creator, the creator still sees edit/delete enabled. On
  use, the app warns about data loss and, on confirmation, deletes that SelectedDetail (with the
  creator's Values and personalizations for it, `SEL-4`). The Detail is then mutable again and the
  requested edit/delete proceeds.
- `DET-10` When all SelectedDetails of a Detail are deleted, it becomes mutable again.
- `DET-11` Each Opinion persists `selectedDetailCount`, maintained in the same transaction as
  every SelectedDetail insert/delete.

### 5.3 Automatic cleanup of Opinions

- `DET-12` An Opinion has `upForDeletionDate`. It is set to *now + 7 days* when the Detail is
  created and whenever its last SelectedDetail is deleted.
- `DET-13` Creating a SelectedDetail for the Detail clears `upForDeletionDate`.
- `DET-14` An Opinion with zero SelectedDetails is deleted automatically once
  `upForDeletionDate` passes. This applies to default and archived Details too.

### 5.4 Facts

- `FACT-1` Only `ADMIN`s create Facts and change their definition.
- `FACT-2` Facts have no SelectedDetails, no `private` flag, no `selectedDetailCount` and no
  automatic cleanup: `DET-4`, `DET-7..14` and §6 do not apply to them.
- `FACT-3` A Fact is mutable (freely editable by admins) while no Item has a FactValue for it. Once
  any FactValue exists, the `DET-7a` restrictions apply, with the allowed changes made by admins.
- `FACT-4` Facts are never deleted, by anyone. They may be archived (`ARC-3`).
- `FACT-5` A Fact may be marked `required`. A required Fact must have a FactValue when an Item is
  created or when its FactValues are edited. Items that existed before a Fact became required are
  grandfathered: they show the Fact as unknown until someone fills it (`FVAL-3`).
- `FACT-6` A List always has at least one required, non-archived Fact referenced by its name
  template. Any action that would break this (un-requiring, archiving, editing the template) is
  blocked.

### 5.5 Archiving and remapping

- `ARC-1` **Who archives**: `ADMIN`s archive and unarchive Facts, Options of any Detail, and Items
  (`ITEM-3`). Opinions may be archived by their creator or any `ADMIN`.
- `ARC-2` **Archived Option**: hidden from pickers and new answers; existing Values and FactValues
  that use it keep displaying it and can still be filtered and searched on.
- `ARC-3` **Archived Fact**: hidden from Item create/edit forms, no longer `required`, excluded from
  the uniqueness key (`UNIQ-1`); existing FactValues still display and are searchable.
- `ARC-4` **Archived Opinion**: hidden from the "available Details" picker (no new
  SelectedDetails) and removed from the default set. Existing SelectedDetails stay **read-only**:
  owners still see their Values and may delete the SelectedDetail, but cannot add or change Values.
  Aggregates are still shown. The consensus job neither creates nor re-checks ConsensusValues for
  it. Automatic cleanup still applies (`DET-14`).
- `ARC-5` **Remap**: an `ADMIN` may move every Value and FactValue using Option *X* to Option *Y* of
  the same Detail; *X* is then archived. For `tags`, a Value that already holds *Y* simply loses *X*
  (no duplicates). Each OptionPersonalization on *X* moves to *Y* if its Contributor has none on *Y*,
  otherwise it is dropped. ConsensusValues for every affected (Item, Detail) are recomputed
  immediately.

## 6. SelectedDetails (personal view)

SelectedDetails exist for Opinions only.

- `SEL-1` A SelectedDetail links one Contributor to one Opinion; at most one per
  (Contributor, Detail).
- `SEL-2` A Contributor builds their view by dragging Opinions into their SelectedDetails
  list, which creates a SelectedDetail referencing the Detail.
- `SEL-3` A Contributor customizes their own SelectedDetails: `position`, `private` (`PRIV-2`),
  label display. SelectedDetails are private to their Contributor.
- `SEL-4` Only the owning Contributor may delete a SelectedDetail. Deleting it also deletes that
  Contributor's Values, OptionPersonalizations and ValuePersonalizations for the Detail.
- `SEL-5` Default Details produce an initial set of SelectedDetails for each new active member,
  authored by that member. The member may delete them or select others afterwards. Being default
  does not protect a Detail from its creator (`DET-7`) or from cleanup (`DET-14`).
- `SEL-6` A SelectedDetail holds one or many Values according to the Detail type (`DET-1`).
- `SEL-7` Marking a Detail as default also creates a SelectedDetail for every existing active
  member who does not already have one.

## 7. Items and Reviews

### 7.1 Items

- `ITEM-1` Any active member may add an Item to the List. Creating an Item requires a FactValue for
  every required, non-archived Fact, and the creator's Review label (`REV-3`) in the same step.
- `ITEM-2` The creator may delete an Item only if they are the only Contributor with a Review on it.
- `ITEM-3` `ADMIN`s may **archive** (and unarchive) an Item. An archived Item is hidden from List
  search and cannot receive new Reviews; Contributors who already reviewed it still see it and their
  Review. Archived Items are excluded from uniqueness checks (`UNIQ-1`) and from List statistics
  (`MEM-2`). Unarchiving is blocked when the Item would collide with a non-archived one (`UNIQ-3`).
- `ITEM-4` Items do not store aggregates; they are computed on the fly or read from
  ConsensusValue (§10).
- `ITEM-5` An Item consists of: its FactValues, the generated `name` (§7.3), one optional photo,
  `archived`, and the audit fields (`AUD-1`). There is no description field — Lists that want one
  use a text Fact. `createdAt` is available for sorting and filtering.
- `ITEM-6` An Item is deleted whenever its number of Reviews reaches zero — by Review deletion
  (`REV-4`), a Contributor leaving (`LEAVE-3`) or a ban purge (`MOD-2a`). The app warns before a user
  action causes this.
- `ITEM-7` The photo follows the FactValue editing rules (`FVAL-3`); `ADMIN`s may also remove it.
  Photos are stored in object storage. EXIF and other metadata (notably GPS location) are stripped
  on upload. A photo records its uploader and is deleted when they delete their account (`ACC-4`);
  the Item's photo slot then becomes empty and fillable again.

### 7.2 FactValues

- `FVAL-1` A FactValue belongs to one Item and one Fact; at most one per (Item, Fact). It holds the
  answer matching the Fact's type (`DET-1`) within its range (`DET-5`); selected Options must belong
  to the same Fact.
- `FVAL-2` FactValues are shared: every active member sees them. They are not aggregated and have no
  ConsensusValue.
- `FVAL-3` Editing:
  - any active member may **fill an empty** FactValue (or photo);
  - the Item's creator may **change** a non-empty one while they are its only reviewer;
  - `ADMIN`s may change any FactValue at any time.
- `FVAL-4` FactValues are deleted with their Item.

### 7.3 Name and search

- `NAME-1` Every Item's `name` is generated from its FactValues by the List's name template
  (`LIST-5`) and stored (denormalized) for display and search.
- `NAME-2` Rendering: numbers as entered, dates in ISO format, `tags` as Option names comma-joined
  in Option position order, `location` as its display name, `singleSelect` and `text` as is.
- `NAME-3` A placeholder whose FactValue is empty is dropped, and surplus whitespace collapsed.
- `NAME-4` Changing the template, or any FactValue, regenerates the affected names in the same
  transaction.
- `NAME-5` Item search matches the generated name **and** the text of every FactValue, so Facts not
  in the template are still searchable.
- `NAME-6` The generated name is always visible. On the Item page, Facts are hidden by default; a
  Contributor may choose which Facts to show, saved in their `screenConfig` (`MEM-5`).

### 7.4 Uniqueness

- `UNIQ-1` The uniqueness key of an Item is its FactValues for all required, non-archived Facts.
  No two non-archived Items in a List may have equal keys.
- `UNIQ-2` Equality per Fact follows `AGG-2`; `tags` compare as sets of Options. A missing
  FactValue is distinct from everything, including another missing one.
- `UNIQ-3` Uniqueness is checked when an Item is created, when its FactValues are edited, and when
  it is unarchived. A violating create, edit or unarchive is blocked and the existing Item is shown, with an option to open (and
  review) it.
- `UNIQ-4` Changes to the key itself (a Fact becoming required, or archived) may produce collisions
  among existing Items; these are allowed and flagged to admins, not blocked. Since Items are never
  merged, admins resolve them by archiving (`ITEM-3`), or creators by deleting (`ITEM-2`).
- `UNIQ-5` Because the rule is not a constant set of columns, it is enforced in application/trigger
  logic, not by a database unique index.

### 7.5 Reviews

- `REV-1` A Review is one Contributor's verdict on one Item. There is exactly one Review per
  (Contributor, Item).
- `REV-2` A Review has a **required** label: `FAVORITE`, `GOOD`, `OK`, `BAD` or `WISH_TO_TRY`.
  The label can be changed but not cleared. Changing the label (including to `WISH_TO_TRY`) never
  affects the Review's Values, and `WISH_TO_TRY` Reviews count toward aggregates like any other.
- `REV-3` A Contributor must create a Review (choose a label) before answering any Opinions
  for that Item. The Review then contains their Values. An Item's creator creates their Review
  together with the Item (`ITEM-1`).
- `REV-4` The creator may delete their Review; its Values (and their ValuePersonalizations) are
  deleted with it. If it was the Item's last Review, the Item is deleted too (`ITEM-6`).

## 8. Values and personalization

### 8.1 Values

- `VAL-1` A Value belongs to one Review and one SelectedDetail, so it identifies Contributor, Item
  and Opinion. At most one Value per (Review, Detail).
- `VAL-2` A Value holds the answer matching the Detail type (`DET-1`), within the Detail's range
  (`DET-5`). Selected Options must belong to the same Detail and must not be archived at the time
  of answering.
- `VAL-3` A Contributor may create, change and delete only their own Values, and not on archived
  Details (`ARC-4`) or archived Items (`ITEM-3`).
- `VAL-4` A Value is deleted when its Review or SelectedDetail is deleted.
- `VAL-5` Where a Contributor has no Value for an (Item, Detail) that has a ConsensusValue, the
  ConsensusValue is displayed as their answer. Answering the Detail replaces it with their own
  Value in their view.

### 8.2 Personalizations

Personalizations affect only their owner's experience and are never visible to others.

- `PER-1` **OptionPersonalization** — per (Contributor, Option): `sentiment`, `disabled`,
  `position`. Applies to Options of both Opinions and Facts. Deleted when the Option or the
  Contributor is deleted.
- `PER-2` **ValuePersonalization** — per (Contributor, Value): `sentiment`, attached to the
  number/text/date of that Value. Deleted when the Value or the Contributor is deleted. FactValues
  have no personalization.
- `PER-3` Sentiment is an integer 1–5.

## 9. Visibility and privacy

| Data | Owner | Other active members | Non-members |
|---|---|---|---|
| List stats (contributors / non-archived items / reviews counts) | ✓ | ✓ | ✓ |
| Details, Options, Items, FactValues, photos | ✓ | ✓ | — |
| Reviews, Values | ✓ | — (aggregates only) | — |
| SelectedDetails, personalizations, `screenConfig` | ✓ | — | — |
| Aggregate values, answer counts, ConsensusValues | ✓ | ✓ (subject to `PRIV-2`) | — |

- `PRIV-1` A Contributor never sees another Contributor's individual Reviews, Values,
  SelectedDetails or personalizations — only aggregates and answer counts.
- `PRIV-2` Values from a SelectedDetail marked `private`:
  - are **never** included in displayed answer counts — counts are always computed from
    non-private Values only;
  - are included in determining the aggregate value and consensus only when that (Item, Detail)
    has **more than 5** answers in total (private and non-private).

  When private Values influenced the shown aggregate, the UI indicates "includes private answers".
  Displayed counts and the aggregate may therefore disagree. Since consensus requires more than 10
  answers (`AGG-4`), private Values always count toward ConsensusValues.

  *Accepted residual leak*: a Contributor whose answer crosses the threshold may see the aggregate
  winner flip and infer something about the private answers; counts never reveal them.
- `PRIV-3` Values of `BANNED` Contributors are excluded from aggregates, counts and consensus while
  the ban lasts (`MOD-2a`).

## 10. Aggregates and consensus

Aggregates and consensus apply to Opinions only; Facts hold a single shared FactValue.

### 10.1 Aggregate value (live)

- `AGG-1` For each (Item, Detail) the aggregate value is the most popular answer among all
  Contributors' Values (subject to `PRIV-2`, `PRIV-3`), computed on the fly. Answer counts are
  visible too (non-private only, `PRIV-2`).
- `AGG-2` Popularity uses exact matching for every type:

  | Type | Matching |
  |---|---|
  | `singleSelect` | same Option |
  | `tags` | each Option counted independently; aggregate is the per-Option counts |
  | `number` | same exact number |
  | `date` | same date |
  | `text` | same text, case- and whitespace-insensitive |
  | `location` | same `placeId` |

- `AGG-3` If two or more answers tie for most popular, no aggregate value is shown.

### 10.2 ConsensusValue (frozen)

- `AGG-4` When an (Item, Detail) has **more than 10** answers and the most popular answer is
  chosen by **more than 90%** of them, it is stored as the ConsensusValue for that pair and is no
  longer computed live. For `tags`, each Option chosen by more than 90% becomes part of the
  consensus.
- `AGG-5` ConsensusValues are re-checked daily by a background job (skipping archived Details,
  `ARC-4`). If the conditions in `AGG-4` no longer hold, the ConsensusValue is deleted and live
  computation resumes. Remapping recomputes affected pairs immediately (`ARC-5`).
- `AGG-6` A ConsensusValue serves as the default answer for Contributors who have not answered
  (`VAL-5`).
- `AGG-7` A ConsensusValue is deleted when its Item or Detail is deleted.
- `AGG-8` Banned Contributors' Values do not count (`PRIV-3`); the daily job picks up the change.

## 11. Cross-cutting rules

### 11.1 Audit fields

- `AUD-1` Every object has `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`; `*By` reference
  the acting Contributor (`LEAVE-4` for departures).

### 11.2 Entity summary and lifecycle

| Entity | Belongs to | Unique per | Who can delete | Cascade-deleted when |
|---|---|---|---|---|
| User | — | `username` | the user (account deletion, `ACC-3`) | — |
| Contributor | User, List | (User, List) | self (leaving); kept as `BANNED` when banned (`MOD-2a`) | User (incl. `BANNED` records, `ACC-4`) or List deleted |
| List | — | — | sole Contributor (`LIST-3`) | last Contributor leaves (`LEAVE-6`) |
| Item | List | uniqueness key (`UNIQ-1`) | creator, if sole reviewer | List deleted; Review count reaches zero (`ITEM-6`) |
| Review | Contributor, Item | (Contributor, Item) | creator | Item or Contributor deleted |
| Detail (`OPINION`) | List | — | creator, while mutable (`DET-7..9`) | List deleted; auto-cleanup (`DET-14`); creator leaves and nobody else uses it |
| Detail (`FACT`) | List | — | nobody (`FACT-4`) | List deleted |
| Option | Detail | — | nobody once Detail in use (archive/remap instead, `ARC-5`) | Detail deleted |
| FactValue | Item, Fact | (Item, Fact) | — (edited, `FVAL-3`) | Item deleted |
| SelectedDetail | Contributor, Opinion | (Contributor, Detail) | owner | Detail or Contributor deleted |
| Value | Review, SelectedDetail | (Review, Detail) | creator | Review or SelectedDetail deleted |
| ConsensusValue | Item, Detail | (Item, Detail) | system (`AGG-5`) | Item or Detail deleted |
| OptionPersonalization | Contributor, Option | (Contributor, Option) | owner | Option or Contributor deleted; dropped on remap conflict (`ARC-5`) |
| ValuePersonalization | Contributor, Value | (Contributor, Value) | owner | Value or Contributor deleted |
| Item photo | Item, uploading User | one per Item | uploader's account deletion; `ADMIN` removal (`ITEM-7`) | Item deleted; uploader deletes account (`ACC-4`) |
| Report | reporting User, reported object | — | system, one year after resolution (`UGC-1`) | reporter deletes account; reported object deleted |
| Block | blocking User, blocked User | (blocker, blocked) | blocker | either User deleted |

### 11.3 Permission matrix

| Action | Non-member / PENDING / REJECTED / BANNED | MEMBER | ADMIN |
|---|---|---|---|
| Search Lists, view stats | ✓ | ✓ | ✓ |
| Apply to join | ✓ except BANNED | — | — |
| View Details, Facts, Items, aggregates | — | ✓ | ✓ |
| Create Opinion / Item | — | ✓ | ✓ |
| Create / edit Facts, name template | — | — | ✓ |
| Add Option to any Detail | — | ✓ | ✓ |
| Edit/delete own Opinion while mutable | — | ✓ | ✓ |
| Allowed changes to in-use Opinion (`DET-7a`) | — | own only | ✓ |
| Fill empty FactValue / photo | — | ✓ | ✓ |
| Change non-empty FactValue / photo | — | own Item, if sole reviewer | ✓ |
| Remove photo | — | — | ✓ |
| Write own Reviews, Values, SelectedDetails, personalizations | — | ✓ | ✓ |
| Approve / reject applicants | — | — | ✓ |
| Ban / unban MEMBER | — | — | ✓ |
| Ban / unban / demote ADMIN | — | — | junior ADMINs only (`MOD-5`) |
| Promote MEMBER → ADMIN | — | — | ✓ |
| Step down to MEMBER | — | — | ✓ |
| Configure admission, filters, terms, unlisted | — | — | ✓ |
| Mark Details as default | — | — | ✓ |
| Archive Item / Fact / Option; remap Options | — | — | ✓ |
| Archive Opinion | — | own only | ✓ |
| Use / regenerate own invite link | — | ✓ | ✓ |
| Delete List | — | if sole contributor | if sole contributor |
| Report content (`UGC-1`) | ✓ (Lists from search) | ✓ | ✓ |
| Block a User (`UGC-3`) | ✓ | ✓ | ✓ |
| Download my data (`DATA-1`) | ✓ | ✓ | ✓ |
| Delete my account (`ACC-3`) | ✓ | ✓ | ✓ |

Permissions above apply only to Users who are not `suspended` (`UGC-2`); a suspended User may still
download their data and delete their account.

## 12. Accounts, data rights and compliance

The app ships on the App Store and Google Play, signs in with email, Sign in with Apple and Google,
serves EU users, and hosts user-generated content (List names and terms, Detail and Option names,
FactValues, photos). This section turns the resulting obligations into rules:

| Source | Obligation | Rules |
|---|---|---|
| App Store Guideline 5.1.1(v) | In-app account **deletion** (not deactivation) incl. personal data; revoke Sign in with Apple tokens | `ACC-3`, `ACC-4` |
| Google Play User Data policy | In-app deletion path **and** a web link to request deletion; retention only for legal/security reasons, disclosed | `ACC-3`, `DATA-2` |
| GDPR Art. 17 (erasure), Art. 5(1)(e) (storage limitation) | Delete on request; keep no longer than needed | `ACC-4..6`, `DATA-2` |
| GDPR Art. 15 (access), Art. 20 (portability) | Give users their data, machine-readable, within one month | `DATA-1` |
| GDPR Art. 8, COPPA | Children's consent | `ACC-1` |
| App Store Guideline 1.2, Google Play UGC policy | Terms with zero tolerance, content filtering, reporting, blocking, developer acts within 24 h, contact info | `ACC-1`, `ACC-2`, `UGC-1..4` |

### 12.1 Accounts

- `ACC-1` Creating an account requires confirming the User is **16 or older** and accepting the
  app-level Terms of Use (`appTermsAcceptedVersion` on User). The Terms state zero tolerance for
  objectionable content and abusive users. When the Terms change, Users must re-accept them on their
  next visit. This is separate from any List's own `terms` and "over 21" filter (`JOIN-4`).
- `ACC-2` The privacy policy, the Terms and a developer contact are reachable from inside the app and
  from the store listings.
- `ACC-3` **Account deletion** is available in-app, from an easy-to-find place in Settings, with a
  confirmation step. A public web page lets a User request the same deletion without the app.
- `ACC-4` Account deletion is immediate and complete:
  - it acts as leaving every List (`LEAVE-3`, `LEAVE-4`) in every status, including `BANNED`
    Contributor records and data retained under `MOD-2a`;
  - it deletes the User's photos (`ITEM-7`), reports they filed, their blocks, and the User record
    with its Supabase auth identity;
  - it revokes the User's Sign in with Apple tokens through Apple's REST API.
- `ACC-5` What survives deletion is only shared List content: Items reviewed by others, Facts,
  Options, FactValues and Opinions used by others. Every reference to the User on it is replaced with
  the "deleted contributor" placeholder (`LEAVE-4`).
- `ACC-6` Deleted data also leaves backups and logs once they age out, **within 30 days**, which
  the privacy policy states. Backup and log retention (including point-in-time recovery) is never
  configured longer than 30 days.

### 12.2 Data rights and retention

- `DATA-1` **Download my data**: any User, in any status (including `BANNED` and `suspended`), can
  download from the app a machine-readable JSON file of everything tied to them across all Lists:
  User fields, Contributors, Reviews, Values, SelectedDetails, personalizations, `screenConfig`, and
  the Items, Details, Options, FactValues and photos they created.
- `DATA-2` Personal data is kept only as long as needed: account data until account deletion, a
  banned or suspended Contributor's data at most one year (`MOD-2a`, `UGC-2`), resolved reports one
  year after resolution (`UGC-1`). Retention and its reasons are disclosed in the privacy policy and the stores' data
  forms (App Store privacy labels, Google Play Data safety).

### 12.3 User-generated content

- `UGC-1` Any User may **report** a List (name or terms), an Item, a photo, a Fact, Option or Opinion
  name, or a text FactValue. A report goes both to that List's `ADMIN`s and to the developer's
  moderation queue. A resolved report is deleted one year after resolution, or immediately when
  the reporter deletes their account (`ACC-4`). Photos are moderated through reports only — there is
  no automated image scanning.
- `UGC-2` The developer acts on reports within **24 hours**: archiving or removing the content,
  and/or **suspending** the offending User platform-wide (`suspended` on User):
  - only the developer suspends, through an admin script or Edge Function;
  - a suspension lasts until the developer lifts it;
  - a suspended User sees a suspension screen with the reason and an appeal contact, and cannot use
    the app except to download their data or delete their account;
  - each of their Contributors is treated as `BANNED` (`MOD-2a`), and the one-year purge applies;
  - lifting the suspension restores each Contributor to its previous status, keeping `adminSince`.
- `UGC-3` A User may **block** another User. The blocked User cannot apply to any List where the
  blocker is an `ADMIN`, and the blocker's invite links do not work for them. The blocked User's
  content stays visible to the blocker. Blocks are private and the blocked User is not notified.
- `UGC-4` Text content shown to other Users (List names and terms, Detail and Option names, text
  FactValues) is checked on write against a word list with whole-word matching. Matching text is
  **rejected** with a "contains disallowed words" message. The developer maintains an allowlist of
  legitimate words that would otherwise match (e.g. "Cockburn").

## 13. Decision log

| # | Question | Decision |
|---|---|---|
| 1 | Number range config | Optional `min`/`max`/`step` on Detail (`DET-5`) |
| 2 | Adding Options later | ~~Only the Detail creator, only while mutable~~ — superseded by 26 |
| 3 | Item aggregates vs ConsensusValue | Aggregate = live most-popular answer; ConsensusValue = frozen at >90% of >10 answers (§10) |
| 4 | Saved screen configs | `screenConfig` JSON on Contributor (`MEM-5`) |
| 5 | Who moderates | ADMINs; ADMINs act on junior ADMINs by seniority (`MOD-1`, `MOD-2`) — revised by 39 |
| 6 | Leaver's shared Items | Kept if others reviewed them (`LEAVE-3`, `ITEM-6`) |
| 7 | Leaver's unused Details | Deleted immediately (`LEAVE-3`) |
| 8 | Re-applying | REJECTED may re-apply; BANNED may not until unbanned (`JOIN-5`, `JOIN-6`) |
| 9 | Owner leaving | ~~Must transfer ownership first~~ — superseded by 39 |
| 10 | Promotion | ADMINs promote; demotion of junior ADMINs only (`MOD-3`) — revised by 39 |
| 11 | `SelectedDetail.private` | Private answers count in aggregates only when anonymity is preserved — refined by 42 |
| 12 | Privacy threshold | More than 5 answers per (Item, Detail); old "≤3 SelectedDetails" rule removed |
| 13 | Number consensus | Exact-match most popular, like every other type (`AGG-2`) |
| 14 | Ties | No aggregate shown; text compared case/whitespace-insensitively (`AGG-2`, `AGG-3`) |
| 15 | Location | `placeId` + name + coordinates; equality by `placeId` (`DET-1`) |
| 16 | Discovery | Public search + invite links; admins can make a List unlisted (`JOIN-1`) |
| 17 | Review label | Required before answering Details (`REV-2`, `REV-3`) |
| 18 | Consensus re-check cadence | Daily background job (`AGG-5`) |
| 19 | Invite links | Per-member, permanent, regenerable; admission rules still apply; `invitedBy` recorded (`JOIN-1a`) |
| 20 | Banned contributor's data | ~~Deleted like a leaver~~ — superseded by 43 |
| 21 | Private Values in consensus | Intended — always counted (`PRIV-2`) |
| 22 | Values on `WISH_TO_TRY` | Kept; label changes never touch Values (`REV-2`) |
| 23 | Item identity | Structured, via **Facts** — not a free-text name (§5.4) |
| 24 | Modelling Facts | A Detail with `kind = FACT`; existing Details are `OPINION` (`DET-1a`) |
| 25 | Fact governance | Admins create; never deleted; optional `required` that applies to new Items and edits only, existing Items grandfathered (`FACT-1..5`) |
| 26 | Options | Any active member adds Options to any Detail; no renaming or deleting once in use (`DET-6`) |
| 27 | Bad Options / dead Facts | Admins archive and remap, for both Detail kinds; tags deduped, personalizations moved or dropped, consensus recomputed immediately (§5.5) |
| 28 | Editing FactValues | Creator while sole reviewer; admins always; anyone fills empty values (`FVAL-3`) |
| 29 | Item name | Generated from an admin-defined template over Facts; every List has ≥1 required Fact from creation (`LIST-2`, `LIST-5`, §7.3) |
| 30 | Template rules | Default = required Facts in order; must reference a required Fact; empty placeholders collapse; regenerate in the same transaction; search covers name + all FactValues (§7.3, `FACT-6`) |
| 31 | Duplicate Items | Hard uniqueness on required Facts (§7.4) |
| 32 | Uniqueness details | Required, non-archived Facts; missing = distinct; existing collisions flagged, not blocked; no merge (`UNIQ-1..5`) |
| 33 | Item fields | FactValues, one optional photo, `archived`, audit fields; no description (`ITEM-5`, `ITEM-7`) |
| 34 | Disable vs archive | Single admin-only `archived` flag replaces disable; excluded from search, uniqueness and stats (`ITEM-3`) |
| 35 | Changes to in-use Details | No rename, retype, `step` change or narrowing; widening and `private` default allowed (`DET-7a`) |
| 36 | Archiving Opinions | Creator or admins; SelectedDetails read-only; aggregates shown; consensus job skips (`ARC-4`) |
| 37 | Default Details | Not protected from cleanup or creator; marking default backfills existing members (`SEL-5`, `SEL-7`) |
| 38 | Fact display | Hidden on Item page by default, shown via `screenConfig`; name always visible (`NAME-6`) |
| 39 | OWNER role | Dropped. Creator is first ADMIN; ADMINs ranked by `adminSince` and act only on junior ADMINs (`MOD-2`, `MOD-3`, `MOD-5`) |
| 40 | Succession | ADMINs may step down; last ADMIN gone → longest-tenured MEMBER promoted; last contributor gone → List deleted; only a sole contributor deletes a List (`MOD-6`, `LEAVE-6`, `LIST-3`) |
| 41 | Qualification filters | Enforced in UI before applying; terms changes / newly enabled filters prompt existing members; Approval→Automatic admits PENDING (`JOIN-8..10`) |
| 42 | Private answer leakage | Displayed counts use non-private Values only; private Values affect only the winner above the threshold (`PRIV-2`) |
| 43 | Bans | Data kept but hidden and excluded from aggregates; restored on unban; purged after one year (`MOD-2a`) — revised by 48 |
| 44 | Unreviewed Items | Creating an Item requires the creator's Review; an Item with zero Reviews is deleted (`ITEM-1`, `ITEM-6`) |
| 45 | Personalizing Facts | OptionPersonalization applies to Fact Options; no personalization of FactValues (`PER-1`, `PER-2`) |
| 46 | Account deletion | In-app plus a public web page; immediate; revokes Sign in with Apple tokens; required by App Store 5.1.1(v) and Google Play (`ACC-3`, `ACC-4`) |
| 47 | Data export | Self-service in-app JSON download for every User, in any status (`DATA-1`) |
| 48 | Banned data vs. user rights | One-year retention yields to account deletion (purged immediately); banned users may export (`MOD-2a`, `ACC-4`, `DATA-1`) |
| 49 | Minimum age | 16+ at account creation, avoiding GDPR Art. 8 parental consent and COPPA (`ACC-1`) |
| 50 | UGC reports | Go to the List's ADMINs **and** a developer queue; developer acts within 24 h (`UGC-1`, `UGC-2`) |
| 51 | Platform suspension | Developer can suspend a User app-wide; their Contributors are treated as `BANNED` (`UGC-2`) |
| 52 | Blocking and filtering | Users can block Users; text UGC is filtered on write (`UGC-3`, `UGC-4`) — revised by 59, 61 |
| 53 | Photos | EXIF/GPS stripped on upload; deleted with the uploader's account (`ITEM-7`) |
| 54 | Unarchiving a colliding Item | Blocked, like creating a duplicate; the conflicting Item is shown (`ITEM-3`, `UNIQ-3`) |
| 55 | Options on unused Details | Freely renamed and deleted while unused; frozen once in use (`DET-6`) |
| 56 | Backup retention | Deleted data leaves backups within 30 days; retention never configured longer (`ACC-6`) |
| 57 | Photo moderation | Reports only; no automated image scanning (`UGC-1`) |
| 58 | Report retention | One year after resolution (`UGC-1`, `DATA-2`) |
| 59 | Blocking | Keeps the blocked User out of Lists where the blocker is ADMIN and off the blocker's invite links; content stays visible (`UGC-3`) |
| 60 | Suspension details | Developer only; until lifted; one-year purge; lifting restores status and seniority; suspension screen with reason and appeal contact (`UGC-2`) |
| 61 | Text filter | Reject on write; word list, whole-word matching, developer-maintained allowlist (`UGC-4`) |

## 14. Open questions

None at present.

# Goods — Product & Data Specification

> Derived from and refining [`datamodel/datamodel_specs.md`](datamodel/datamodel_specs.md).
> Rule IDs (e.g. `DET-3`) are stable references for tickets, tests and code comments.
> Decisions taken while refining are logged in [§12](#12-decision-log); remaining gaps are in
> [§13](#13-open-questions).

---

## 1. Purpose

Goods lets groups of people review **anything**. A **List** defines a subject (e.g. *Wine*) and a
configurable set of **Details** — questions/attributes such as *type*, *year*, *region* — that
describe the things being reviewed. Members (**Contributors**) add **Items** (e.g. a specific
bottle), give each one a **Review** label, and answer the Details. Each Contributor tailors their
own view of the List and keeps their individual answers private; everyone sees the **aggregate**
(most popular) answers, and answers with overwhelming agreement are frozen as **consensus** and
shown as the default for anyone who hasn't answered.

## 2. Glossary

| Term | Meaning |
|---|---|
| **User** | An account. Holds only `username`. |
| **List** | A reviewing community around one subject (e.g. *Wine*). |
| **Contributor** | A User's membership in one List, with a status. |
| **Detail** | A List-level question/attribute definition (name, type, options, range, privacy default). |
| **Option** | A predefined choice of a `singleSelect` or `tags` Detail. |
| **SelectedDetail** | A Contributor's adoption of a Detail into their own view, with personal display settings. |
| **Item** | A thing being reviewed within a List (e.g. one specific wine). |
| **Review** | One Contributor's verdict on one Item: a required label plus Values. |
| **Value** | One Contributor's answer to one Detail for one Item. |
| **Aggregate value** | The most popular answer to a Detail for an Item, computed on the fly. |
| **ConsensusValue** | A stored aggregate with overwhelming agreement (`AGG-4`); no longer computed live. |
| **OptionPersonalization** | A Contributor's private tweak of an Option (sentiment, disabled, position). |
| **ValuePersonalization** | A Contributor's private sentiment about a Value. |
| **Sentiment** | Integer 1–5 expressing a Contributor's opinion: 1 = bad, 5 = good. |
| **Active member** | A Contributor whose status is `MEMBER`, `ADMIN` or `OWNER`. |

## 3. Roles and membership

### 3.1 Contributor status

| Status | Meaning | List access |
|---|---|---|
| `PENDING` | Applied, awaiting approval | Stats only |
| `REJECTED` | Application declined; may re-apply | Stats only |
| `BANNED` | Removed and blocked by an admin | Stats only |
| `MEMBER` | Regular participant | Full |
| `ADMIN` | Moderator | Full + admin actions |
| `OWNER` | List owner — exactly one per List | Full + admin + owner actions |

- `MEM-1` Only active members (`MEMBER`/`ADMIN`/`OWNER`) may see or change anything inside a List.
- `MEM-2` Everyone else (non-members and `PENDING`/`REJECTED`/`BANNED`) sees only the List's
  statistics: number of contributors, items and reviews.
- `MEM-3` There is at most one Contributor per (User, List).
- `MEM-4` Each List has exactly one `OWNER`.
- `MEM-5` A Contributor has a private `screenConfig` JSON field holding their saved screen state
  (filters, sort, view mode).

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
  - **Automatic** — the applicant becomes `MEMBER` immediately once qualification filters pass.
  - **Approval** — an `ADMIN`/`OWNER` moves the applicant to `MEMBER` or `REJECTED`.
- `JOIN-4` Qualification filters are hardcoded and individually enabled/disabled by admins:
  - **Age** — "Are you over 21?" → boolean stored on Contributor.
  - **Terms** — "Do you accept the terms and conditions?" → boolean stored on Contributor.
    The terms text is an editable string on the List (`terms`), edited on the List edit screen.
- `JOIN-5` A `REJECTED` User may re-apply, which returns them to `PENDING`.
- `JOIN-6` A `BANNED` User cannot re-apply until an `ADMIN`/`OWNER` lifts the ban, which sets the
  status to `REJECTED` (so they may re-apply).
- `JOIN-7` On becoming an active member, the Contributor receives a SelectedDetail for every
  **default** Detail of the List (see `SEL-5`).

### 3.3 Moderation and roles

- `MOD-1` `ADMIN` and `OWNER` approve or reject `PENDING` applicants.
- `MOD-2` `ADMIN` and `OWNER` may ban `MEMBER`s. Only the `OWNER` may ban an `ADMIN`. The `OWNER`
  cannot be banned.
- `MOD-2a` Banning deletes the Contributor's data exactly like leaving (`LEAVE-3`, `LEAVE-4`), but
  the Contributor record is kept with status `BANNED` to block re-applying (`JOIN-6`).
- `MOD-3` `ADMIN` and `OWNER` may promote a `MEMBER` to `ADMIN`. Only the `OWNER` may demote an
  `ADMIN` to `MEMBER`.
- `MOD-4` The `OWNER` may transfer ownership to another active member. The recipient becomes
  `OWNER`; the previous owner becomes `ADMIN`.

### 3.4 Leaving a List

- `LEAVE-1` A Contributor leaves by exiting the List and confirming deletion of their private data
  in that List. The Contributor record is then deleted.
- `LEAVE-2` The `OWNER` cannot leave while other Contributors exist; they must first transfer
  ownership (`MOD-4`).
- `LEAVE-3` Everything the Contributor created in the List is deleted — Reviews, Values,
  SelectedDetails, personalizations, Items, Details and their Options — **except**:
  - Details that still have SelectedDetails belonging to other Contributors, and
  - Items that have Reviews from other Contributors.

  Those survive; they belong to the List, not to their creator.
- `LEAVE-4` Every `createdBy` / `modifiedBy` / `invitedBy` reference to the departed Contributor on surviving
  objects is replaced with a "deleted contributor" placeholder.
- `LEAVE-5` A Contributor is also deleted when its User or List is deleted.

## 4. Lists

- `LIST-1` A List has a name, admission settings (`JOIN-3`, `JOIN-4`), `terms`, an `unlisted` flag,
  and owns its Contributors, Items and Details.
- `LIST-2` The creator becomes its `OWNER` Contributor.
- `LIST-3` The `OWNER` may delete the List only when no other Contributors exist.
- `LIST-4` Admins can mark Details as **default** for the List (`SEL-5`).

## 5. Details (questions)

### 5.1 Definition

- `DET-1` Detail types and the Values they accept:

  | Type | Value |
  |---|---|
  | `singleSelect` | exactly one Option |
  | `tags` | zero to many Options |
  | `number` | exactly one number |
  | `text` | exactly one text |
  | `date` | exactly one date |
  | `location` | exactly one place: `placeId`, display name, latitude/longitude |

- `DET-2` A Detail belongs to a List and is visible to every active member of that List.
- `DET-3` Any active member may create Details.
- `DET-4` A Detail has a `private` flag, which is the default for the `private` field of
  SelectedDetails created from it.
- `DET-5` A `number` Detail has optional `min`, `max` and `step`. When set, Values must satisfy
  them; a bounded Detail may render as a slider, an unbounded one as a numeric input.
- `DET-6` `singleSelect` and `tags` Details have Options, each with a name. Options are part of the
  Detail definition: only the Detail's creator adds, edits or deletes them, and only while the
  Detail is mutable. Options are deleted with their Detail.

### 5.2 Mutability and deletion

A Detail is **mutable** while no other Contributor depends on it.

- `DET-7` Only the Detail's creator may modify or delete it (including its Options), and only while
  it is mutable.
- `DET-8` A Detail with **no** SelectedDetails is mutable.
- `DET-9` A Detail with **any** SelectedDetail is immutable, with one exception: if its **only**
  SelectedDetail belongs to the Detail's creator, the creator still sees edit/delete enabled. On
  use, the app warns about data loss and, on confirmation, deletes that SelectedDetail (with the
  creator's Values and personalizations for it, `SEL-4`). The Detail is then mutable again and the
  requested edit/delete proceeds.
- `DET-10` When all SelectedDetails of a Detail are deleted, it becomes mutable again.
- `DET-11` Each Detail persists `selectedDetailCount`, maintained in the same transaction as every
  SelectedDetail insert/delete.

### 5.3 Automatic cleanup

- `DET-12` A Detail has `upForDeletionDate`. It is set to *now + 7 days* when the Detail is created
  and whenever its last SelectedDetail is deleted.
- `DET-13` Creating a SelectedDetail for the Detail clears `upForDeletionDate`.
- `DET-14` A Detail with zero SelectedDetails is deleted automatically once `upForDeletionDate`
  passes.

## 6. SelectedDetails (personal view)

- `SEL-1` A SelectedDetail links one Contributor to one Detail; at most one per (Contributor,
  Detail).
- `SEL-2` A Contributor builds their view by dragging Details into their SelectedDetails list,
  which creates a SelectedDetail referencing the Detail.
- `SEL-3` A Contributor customizes their own SelectedDetails: `position`, `private` (`PRIV-2`),
  label display. SelectedDetails are private to their Contributor.
- `SEL-4` Only the owning Contributor may delete a SelectedDetail. Deleting it also deletes that
  Contributor's Values, OptionPersonalizations and ValuePersonalizations for the Detail.
- `SEL-5` Default Details produce an initial set of SelectedDetails for each new active member,
  authored by that member. The member may delete them or select others afterwards.
- `SEL-6` A SelectedDetail holds one or many Values according to the Detail type (`DET-1`).

## 7. Items and Reviews

### 7.1 Items

- `ITEM-1` Any active member may add an Item to the List.
- `ITEM-2` The creator may delete an Item only if they are the only Contributor with a Review on it.
- `ITEM-3` Admins may **disable** an Item, which hides it from List search.
- `ITEM-4` Items do not store aggregates; they are computed on the fly or read from
  ConsensusValue (§10).

### 7.2 Reviews

- `REV-1` A Review is one Contributor's verdict on one Item. There is exactly one Review per
  (Contributor, Item).
- `REV-2` A Review has a **required** label: `FAVORITE`, `GOOD`, `OK`, `BAD` or `WISH_TO_TRY`.
  The label can be changed but not cleared. Changing the label (including to `WISH_TO_TRY`) never
  affects the Review's Values, and `WISH_TO_TRY` Reviews count toward aggregates like any other.
- `REV-3` A Contributor must create a Review (choose a label) before answering any Details for
  that Item. The Review then contains their Values.
- `REV-4` The creator may delete their Review; its Values (and their ValuePersonalizations) are
  deleted with it.

## 8. Values and personalization

### 8.1 Values

- `VAL-1` A Value belongs to one Review and one SelectedDetail, so it identifies Contributor, Item
  and Detail. At most one Value per (Review, Detail).
- `VAL-2` A Value holds the answer matching the Detail type (`DET-1`), within the Detail's range
  (`DET-5`). Selected Options must belong to the same Detail.
- `VAL-3` A Contributor may create, change and delete only their own Values.
- `VAL-4` A Value is deleted when its Review or SelectedDetail is deleted.
- `VAL-5` Where a Contributor has no Value for an (Item, Detail) that has a ConsensusValue, the
  ConsensusValue is displayed as their answer. Answering the Detail replaces it with their own
  Value in their view.

### 8.2 Personalizations

Personalizations affect only their owner's experience and are never visible to others.

- `PER-1` **OptionPersonalization** — per (Contributor, Option): `sentiment`, `disabled`,
  `position`. Deleted when the Option or the Contributor is deleted.
- `PER-2` **ValuePersonalization** — per (Contributor, Value): `sentiment`, attached to the
  number/text/date of that Value. Deleted when the Value or the Contributor is deleted.
- `PER-3` Sentiment is an integer 1–5.

## 9. Visibility and privacy

| Data | Owner | Other active members | Non-members |
|---|---|---|---|
| List stats (contributors/items/reviews counts) | ✓ | ✓ | ✓ |
| Details, Options, Items | ✓ | ✓ | — |
| Reviews, Values | ✓ | — (aggregates only) | — |
| SelectedDetails, personalizations, `screenConfig` | ✓ | — | — |
| Aggregate values, answer counts, ConsensusValues | ✓ | ✓ (subject to `PRIV-2`) | — |

- `PRIV-1` A Contributor never sees another Contributor's individual Reviews, Values,
  SelectedDetails or personalizations — only aggregates and answer counts.
- `PRIV-2` Values from a SelectedDetail marked `private` are included in an (Item, Detail)
  aggregate only when that (Item, Detail) has **more than 5** answers in total. Below that, the
  aggregate is computed from non-private Values only. Since consensus requires more than 10
  answers (`AGG-4`), private Values always count toward ConsensusValues.

## 10. Aggregates and consensus

### 10.1 Aggregate value (live)

- `AGG-1` For each (Item, Detail) the aggregate value is the most popular answer among all
  Contributors' Values (subject to `PRIV-2`), computed on the fly. Answer counts are visible too.
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
- `AGG-5` ConsensusValues are re-checked daily by a background job. If the conditions in
  `AGG-4` no longer hold, the ConsensusValue is deleted and live computation resumes.
- `AGG-6` A ConsensusValue serves as the default answer for Contributors who have not answered
  (`VAL-5`).
- `AGG-7` A ConsensusValue is deleted when its Item or Detail is deleted.

## 11. Cross-cutting rules

### 11.1 Audit fields

- `AUD-1` Every object has `createdAt`, `createdBy`, `modifiedAt`, `modifiedBy`; `*By` reference
  the acting Contributor (`LEAVE-4` for departures).

### 11.2 Entity summary and lifecycle

| Entity | Belongs to | Unique per | Who can delete | Cascade-deleted when |
|---|---|---|---|---|
| User | — | `username` | the user (account deletion) | — |
| Contributor | User, List | (User, List) | self (leaving, `LEAVE-2`); kept as `BANNED` when banned (`MOD-2a`) | User or List deleted |
| List | — | — | OWNER, if sole contributor | — |
| Item | List | — | creator, if sole reviewer | List deleted; creator leaves and nobody else reviewed it |
| Review | Contributor, Item | (Contributor, Item) | creator | Item or Contributor deleted |
| Detail | List | — | creator, while mutable (`DET-7..9`) | List deleted; auto-cleanup (`DET-14`); creator leaves and nobody else uses it |
| Option | Detail | — | Detail creator, while mutable | Detail deleted |
| SelectedDetail | Contributor, Detail | (Contributor, Detail) | owner | Detail or Contributor deleted |
| Value | Review, SelectedDetail | (Review, Detail) | creator | Review or SelectedDetail deleted |
| ConsensusValue | Item, Detail | (Item, Detail) | system (`AGG-5`) | Item or Detail deleted |
| OptionPersonalization | Contributor, Option | (Contributor, Option) | owner | Option or Contributor deleted |
| ValuePersonalization | Contributor, Value | (Contributor, Value) | owner | Value or Contributor deleted |

### 11.3 Permission matrix

| Action | Non-member / PENDING / REJECTED / BANNED | MEMBER | ADMIN | OWNER |
|---|---|---|---|---|
| Search Lists, view stats | ✓ | ✓ | ✓ | ✓ |
| Apply to join | ✓ except BANNED | — | — | — |
| View Details, Items, aggregates | — | ✓ | ✓ | ✓ |
| Create Detail / Item | — | ✓ | ✓ | ✓ |
| Edit/delete own Detail (and its Options), own Item | — | ✓ (rules above) | ✓ | ✓ |
| Write own Reviews, Values, SelectedDetails, personalizations | — | ✓ | ✓ | ✓ |
| Approve / reject applicants | — | — | ✓ | ✓ |
| Ban / unban MEMBER | — | — | ✓ | ✓ |
| Ban / unban ADMIN | — | — | — | ✓ |
| Promote MEMBER → ADMIN | — | — | ✓ | ✓ |
| Demote ADMIN → MEMBER | — | — | — | ✓ |
| Configure admission, filters, terms, unlisted | — | — | ✓ | ✓ |
| Mark Details as default | — | — | ✓ | ✓ |
| Disable Item | — | — | ✓ | ✓ |
| Use / regenerate own invite link | — | ✓ | ✓ | ✓ |
| Transfer ownership | — | — | — | ✓ |
| Delete List | — | — | — | ✓ (if sole contributor) |

## 12. Decision log

| # | Question | Decision |
|---|---|---|
| 1 | Number range config | Optional `min`/`max`/`step` on Detail (`DET-5`) |
| 2 | Adding Options later | Only the Detail creator, only while mutable (`DET-6`) |
| 3 | Item aggregates vs ConsensusValue | Aggregate = live most-popular answer; ConsensusValue = frozen at >90% of >10 answers (§10) |
| 4 | Saved screen configs | `screenConfig` JSON on Contributor (`MEM-5`) |
| 5 | Who moderates | ADMIN and OWNER; only OWNER bans ADMINs (`MOD-1`, `MOD-2`) |
| 6 | Leaver's shared Items | Kept if others reviewed them (`LEAVE-3`) |
| 7 | Leaver's unused Details | Deleted immediately (`LEAVE-3`) |
| 8 | Re-applying | REJECTED may re-apply; BANNED may not until unbanned (`JOIN-5`, `JOIN-6`) |
| 9 | Owner leaving | Must transfer ownership first; one OWNER per List (`LEAVE-2`, `MOD-4`) |
| 10 | Promotion | ADMIN and OWNER promote; only OWNER demotes (`MOD-3`) |
| 11 | `SelectedDetail.private` | Private answers count in aggregates only when anonymity is preserved (`PRIV-2`) |
| 12 | Privacy threshold | More than 5 answers per (Item, Detail); old "≤3 SelectedDetails" rule removed |
| 13 | Number consensus | Exact-match most popular, like every other type (`AGG-2`) |
| 14 | Ties | No aggregate shown; text compared case/whitespace-insensitively (`AGG-2`, `AGG-3`) |
| 15 | Location | `placeId` + name + coordinates; equality by `placeId` (`DET-1`) |
| 16 | Discovery | Public search + invite links; admins can make a List unlisted (`JOIN-1`) |
| 17 | Review label | Required before answering Details (`REV-2`, `REV-3`) |
| 18 | Consensus re-check cadence | Daily background job (`AGG-5`) |
| 19 | Invite links | Per-member, permanent, regenerable; admission rules still apply; `invitedBy` recorded (`JOIN-1a`) |
| 20 | Banned contributor's data | Deleted like a leaver; record kept as `BANNED`; unban → `REJECTED` (`MOD-2a`, `JOIN-6`) |
| 21 | Private Values in consensus | Intended — always counted (`PRIV-2`) |
| 22 | Values on `WISH_TO_TRY` | Kept; label changes never touch Values (`REV-2`) |

## 13. Open questions

None at present.

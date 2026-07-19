## Domain model overview


(Example: )

This application allow to review anything. (Example: Wine)
Configurable Lists with custom Details(Questions/fields) allow to decribe any kind of reviewd item. (Example: List would have a name Wine)

User can join the list and become Contributer. 
User cannot see any info in the list apart from statistics (Number of contributors, items, reviews).
User can apply to enter the list and can be automatically accepted or with approval or with age confirmation. Thiw will be configured on the List page (Example: After answering "Are you over 21?" question) 
Answers to List questions will be saved on Contributer

List have details(Questions) which are visible to anyone (Example: Wine type, year, etc.) 
Contributer can add new details(Questions) to the list but not edit or delete them

List have SelectedDetail which are details that are used and or customized by the contributor. 
Contributer can drag details(Questions) to the seclectedDetails list the new  seclectedDetails will be created with link to detail(Question)
Contributer can cutomize Selected details (position, privacy, label display)


Contributer can add Item to the list 
Contributer can create a Review  by selecting predefined multiple choice (  FAVORITE, GOOD, OK, BAD, WISH_TO_TRY ) on the Item
There is exactly one Review per contributor per item
Contributer can and answer all questions/details by selecting possible options or setting  descrete values 
Contributer can personalize option with  (sentiment, disabled, position) fields
Contributer can personalize Value with  (sentiment that corrspond to a number/text/date) fields
Sentiment is an int value from 1 to 5 that describe contributors opinion of something. 1 bad 5 good

Detail can be of type singleSelect,  number,  text,  tags,  date, location
After Detail has a corresponding SelectedDetail it becomes immutable. 
Detail can be deleted or modified if it has no corresponding SelectedDetail
If detail has only one SelectedDetail and both of them are created by the same user this user can delete the detail with the warning of data loss and cascading deletion of related SelectedDetail it's child objects
Detail has a counter of all corresponding SelectedDetails 
Admins can mark thier SelectedDetails to be default which would be created automatically for new contributors in that List


Contributer cannot see peronalization of other contributors
Contributer cannot see reviews of other contributors
Contributer can see aggregate values counts of other contriobutors 

Item holds aggregate values ie cached projection derived from reviews for this item. 



| Model | Purpose |
|---|---|
| `User` | Account; only `username`. Membership in lists goes through `Contributor`. |
| `Contributor` | Join entity between `User` and `List`, with a role (`OWNER`/`ADMIN`/`MEMBER`/`APPLICANT`) and saved screens configs. |
| `List` | A collection with name, contributors, items, and details. |
| `Item` | A thing being reviewed. |
| `Review` | A contributor's review of an item: a `ReviewLabel` plus a set of `Value`s. |
| `Detail` | A configurable question/attribute definition (type, number range, options). Belongs to a list. |
| `SelectedDetail` | Per-contributor customization of a `Detail` (position, privacy, label display). private per contributor |
| `Option` | A choice for `singleSelect`/`tags` details. |
| `Value` | An answer: number/text/date and/or selected options; belongs to a `Review`
| `ConsensusValue` | An answer: number/text/date and/or selected options; belongs to a `Detail` and an `Item` ( Item + Detail) and holds most popular/average value from all contributors
, and to a `Detail`. |
| `OptionPersonalization` | Per-contributor tweak of an option (sentiment, disabled, position). they only affect that contributor’s personal experience and are invisible to others |
| `ValuePersonalization` | Per-contributor opinion(sentiment) of Contributor's Value. they only affect that contributor’s personal experience and are invisible to others |
| `ConsensusValuePersonalization` | Per-contributor opinion(sentiment) of ConsensusValue Value. |



Contributor application flow state machine.
You describe auto-accept, approval, and age confirmation, but not the exact states and transitions. Define: pending, approved, rejected, revoked, and who can perform each transition.

List question answers storage shape.
“Answers to List questions will be saved on Contributor” is clear directionally, but not structurally. Define whether answers are typed fields, JSON, or linked answer rows, and how you handle question edits/versioning.

Default SelectedDetail behavior.
“Admins can mark their SelectedDetails as default” needs exact semantics:
Are defaults copied into a new contributor’s own SelectedDetail rows at join time, or referenced dynamically?
Who can update defaults later and what happens to already joined contributors?

Detail mutability/deletion rule edge cases.
You have strong rules, but edge conditions are not fully specified:
What if creator leaves list?
What if two admins coordinate edits before first SelectedDetail exists?
What if there is exactly one SelectedDetail but created by an admin acting on behalf of someone else?

ConsensusValue calculation by detail type.
“Most popular/average value” is not enough for all types.
Define per type:
singleSelect and tags: counts or top-k?
number: avg, median, histogram?
date: mode, min/max, recency window?
text and location: do you compute consensus at all, or skip?

Value cardinality constraints.
You should explicitly state allowed payload per detail type:
singleSelect exactly one option,
tags zero-to-many options,
number exactly one numeric,
text exactly one text,
date exactly one date,
location exactly one location.
Also define if unanswered values are allowed in an existing review.

Cascade deletion scope.
You mention cascading child objects, but not the full cascade contract.
If a Detail is deleted, confirm whether Review Values, ConsensusValues, OptionPersonalizations, and ValuePersonalizations are deleted, soft-deleted, or retained as tombstones.

Aggregate privacy guarantees.
Contributors cannot see other reviews, but aggregates can leak when contributor count is low.
Decide whether aggregates are hidden below a threshold (for example fewer than 3 contributors).

Counter source of truth.
“Detail has a counter of corresponding SelectedDetails” should specify whether this is computed on read or persisted and maintained transactionally.

Terminology consistency.
There are still inconsistent spellings and a few overloaded phrases, which can cause schema drift later (Contributer/Contributor, discrete/descrete, etc.). Clean naming now avoids painful migrations.
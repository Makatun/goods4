## Domain model overview


(Example: )

This application allow to review anything. (Example: Wine)
Configurable Lists with custom Details(Questions/fields) allow to decribe any kind of reviewd item. (Example: List would have a name Wine)

User can join the list and become Contributor. 
User cannot see any info in the list apart from statistics (Number of contributors, items, reviews).
User can apply to enter the list and can be automatically accepted or with approval or with age confirmation. Thiw will be configured on the List page (Example: After answering "Are you over 21?" question) 

User can become COntributor and after automatic approval or manual apporoval by list admin. 
Contributor can have diferent states.  pending , approved, rejected, banned. Only approved state allows access to the list

Answers to List questions will be saved on Contributor

List have details(Questions) which are visible to anyone (Example: Wine type, year, etc.) 
Contributor can add new details(Questions) to the list but not edit or delete them

List have SelectedDetail which are details that are used and or customized by the contributor. 
Contributor can drag details(Questions) to the seclectedDetails list the new  seclectedDetails will be created with link to detail(Question)
Contributor can cutomize Selected details (position, privacy, label display)


Contributor can add Item to the list 
Contributor can create a Review  by selecting predefined multiple choice (  FAVORITE, GOOD, OK, BAD, WISH_TO_TRY ) on the Item
There is exactly one Review per contributor per item
When contributor leaves the list all objects created by him in this list are deleted apart from Details that has corresponding SelectedDetails not created by the leaving contributor
Contributor can and answer all questions/details by selecting possible options or setting  discrete values 
Contributor can personalize option with  (sentiment, disabled, position) fields
Contributor can personalize Value with  (sentiment that corrspond to a number/text/date) fields
Sentiment is an int value from 1 to 5 that describe contributors opinion of something. 1 bad 5 good

Detail can be of type singleSelect,  number,  text,  tags,  date, location
Contributors cannot modify or delete details that were not created by them
After Detail has a corresponding SelectedDetail it becomes immutable. 
If all SelectedDetails are deleted for a Detail becomes mutable.
After detail became immutable no one can modify it.
Only Detail createor can modify Detail unless it became immutable. 
Only SelectedDetail creator can delete SelectedDetail
Only Detail creator can delete Detail and can only delete mutable details.
If only one coresponding SelectedDetail exists and it is from the same contibutor he can delete SelectedDetail and modify Detail.
If the only selecteddetail that exists for that detail is from the same Contributor as creator of the detail this creator can delete it with a warning message. IN this case Selected detail and all Values Personalizations will be deleted. 
Contributors cannot modify or delete details that were not created by them.

Detail has a counter of corresponding SelectedDetails persisted and maintained transactionally when selected detail is creasted or deleted


Detail can be deleted or modified if it has no corresponding SelectedDetail
If detail has only one SelectedDetail and both of them are created by the same user this user can delete the detail with the warning of data loss and cascading deletion of related SelectedDetail it's child objects
Detail has a counter of all corresponding SelectedDetails 
Admins can mark Details to be default for a List
Default details will be used to create initial set of SelectedDetails for new Contributors
Details with no corresponding SelectedDetails from any contributors will be deleted automatically after upForDeletionDate is reached
Detail upForDeletionDate is set to one week after last SelectedDetail for that Detail is deleted
If Contributor that created detail leaves the List details stay. Detail is owned by the list not the contributor how created it.


SelectedDetail holds one or many values depending on Detail configuration
If a SelectedDetail is deleted, then corresponding Values, OptionPersonalizations, and ValuePersonalizations are deleted
Contributor can Select his own one or many Values for a DelectedDetail that is his personal answer.
Contributor can change or delete his own Values. 
Contributor cannot see change or delete other congtrobutors Values. 


Contributor cannot see peronalization of other contributors
Contributor cannot see reviews of other contributors
Contributor can see aggregate values counts of other contriobutors 
Detail's aggregates are hidden below 3 contributors for privte Details

Item holds aggregate values ie cached projection derived from reviews for this item. 



Value belongs to Review and SelectedDetail

Value types with explanation:
-singleSelect exactly one option,
- tags zero-to-many options,
- number exactly one numeric,
- text exactly one text,
- date exactly one date,
- location exactly one location.

ConsensusValue calculation by detail type:
- singleSelect and tags: counts
- number: histogram?
- date: most number same date
- text and location: only if it is the same more than 50% of answers?

All objects have created by/who fields and modified by/who

| Model | Purpose |
|---|---|
| `User` | Account; only `username`. Membership in lists goes through `Contributor`. |
| `Contributor` | Join entity between `User` and `List`, with a role (`OWNER`/`ADMIN`/`MEMBER`) and saved screens configs. |
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



\
Cascade delete scope is not complete
You define one cascade path (SelectedDetail deletion), but not all paths:
what happens to ConsensusValue and item aggregates when values are deleted?

ConsensusValue definition is still undecided for several types
You still have question marks for number/date/text/location logic. That means aggregate behavior is not spec-complete yet.

Privacy threshold wording is ambiguous
“Detail’s aggregates are hidden below 3 contributors for private details” needs exact scope:
is private at SelectedDetail level (per user) or Detail level (list-wide)?
who can still see aggregates (admins, owner, creator)?

Default details behavior needs update policy
You defined creation for new contributors, but not what happens when default details change later:
do existing contributors get backfilled, left untouched, or prompted?

Auto-deletion timer edge cases
You define upForDeletionDate after last SelectedDetail deletion, but not whether timer is canceled if a new SelectedDetail is created before expiry.

“All objects have created by / modified by” is underspecified
You should define whether these are user ids, contributor ids, or both. In this model, that choice matters for list-scoped permissions.

Terminology and spelling still vary
There are still multiple typos and inconsistent terms. This is not just cosmetic; inconsistent naming causes schema and API drift later.
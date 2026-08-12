## Domain model overview


(Example: )

This application allow to review anything. (Example: Wine)
Configurable Lists with custom Details(Questions/fields) allow to decribe any kind of reviewd item. (Example: List would have a name Wine)

User can join the list and become Contributor. 
User cannot see any info in the list apart from statistics (Number of contributors, items, reviews) before he becomes contributor.
User can apply to enter the list and can be automatically accepted or with approval or with age confirmation. Thiw will be configured on the List page by Admins of that list. Admins can enable or diable hardcoded qualification filters: boolean on Contributor. "Are you over 21?", boolean on Contributor "Do you Accept Terms and conditions." Editable String on List "terms" which wil hold terms that editable on the list Edit Screen.  

User can become COntributor and after automatic approval or manual apporoval by list admin. 
Contributor can have diferent states.  pending , approved, rejected, banned. Only approved state allows access to the list

Answers to List questions will be saved on Contributor

List have details(Questions) which are visible to any Contributor of this list (Example: Wine type, year, etc.) 
Contributor can add new details(Questions) to the list. Contributor can edit or delete them only if they are not used but other Contributors. 

List have SelectedDetail which are details that are used and or customized by the contributor. 
Contributor can drag details(Questions) to the seclectedDetails list the new  seclectedDetails will be created with link to detail(Question)
Contributor can cutomize Selected details (position, privacy, label display)


Contributor can add Item to the list 
Contributor can create a Review  by selecting predefined multiple choice (  FAVORITE, GOOD, OK, BAD, WISH_TO_TRY ) on the Item
There is exactly one Review per contributor per item

Contributor can and answer all questions/details by selecting possible options or setting  discrete values 
Contributor can personalize option with  (sentiment, disabled, position) fields
Contributor can personalize Value with  (sentiment that corrspond to a number/text/date) fields
Sentiment is an int value from 1 to 5 that describe contributors opinion of something. 1 bad 5 good

Detail can be of type singleSelect,  number,  text,  tags,  date, location
Detail can be marked private and this will be defailt value for SelectedDetail private field. 
Contributors cannot modify or delete details that were not created by them
After Detail has a corresponding SelectedDetail it becomes immutable with some exeptions: 1) If all SelectedDetails are deleted for a Detail becomes mutable again. 2) If there is only one corresponding SelectedDetail and this SelectedDetails is created by Detail creator then this creator can modify or delete this detail but that will trigger corresponding SelectedDetail deletion. Warning shold be displayed for the user in this case.
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
Default details will be used to create initial set of SelectedDetails for new Contributors. THey will be authored by current Contributor.  After creation current contributor can delete them and/or select different details. 
Details with no corresponding SelectedDetails from any contributors will be deleted automatically after upForDeletionDate is reached
Detail upForDeletionDate is set to one week after last SelectedDetail for that Detail is deleted. If someone will create SelectedDetail based on that detail timer stops and reset to 0.
If Contributor that created detail leaves the List details stay. Detail is owned by the list not the contributor how created it.


SelectedDetail holds one or many values depending on Detail configuration
If a SelectedDetail is deleted, then corresponding Contributor's Values, OptionPersonalizations, and ValuePersonalizations are deleted
Contributor can Select his own one or many Values for a DelectedDetail that is his personal answer.
Contributor can change or delete his own Values. 
Contributor cannot see change or delete other congtrobutors Values. 


Contributor cannot see peronalization of other contributors
Contributor cannot see reviews of other contributors
Contributor can see aggregate values counts of other contriobutors 
Detail's aggregates are hidden for Details with 3 or less SelectedDetails for Detail marked private. 

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

All objects have created by/who fields and modified by/who and set to contributor

| Model | Purpose |
|---|---|
| `User` | Account; only `username`. Membership in lists goes through `Contributor`. Deleted if user deletes his account.|
| `Contributor` | Join entity between `User` and `List`, with a role (`OWNER`/`ADMIN`/`MEMBER`) and saved screens configs. Deleted if user or list is deleted. Deleted if user exit the list and confirms deletion of private data within this list.  When contributor leaves the list all objects created by him in this list are deleted apart from Details that has corresponding SelectedDetails not created by the leaving contributor. All created/updated by fields referencing this Contributor are replaced with "deleted contributor" palceholder.|
| `List` | A collection with name, contributors, items, and details. Can be Deleted By creator if no other contributors apart from creators exist. |
| `Item` | A thing being reviewed. Can be deleted by creator if creator is the only one who has associated review. Admin can disable it which will remove Item from the list search. |
| `Review` | A contributor's review of an item: a `ReviewLabel` plus a set of `Value`s. Can be deleted by creator. |
| `Detail` | A configurable question/attribute definition (type, number range, options). Belongs to a list. Can be deleted by creator if it has one or no associated SelectedDetail and selected detail is from the creator |
| `SelectedDetail` | Per-contributor customization of a `Detail` (position, privacy, label display). private per contributor. Can be deleted by controbutor. |
| `Option` | A choice for `singleSelect`/`tags` details. Deleted if detail is deleted. Can be deleted by creator if not selected by anyone else. |
| `Value` | An answer: number/text/date and/or selected options; belongs to a `Review`. Deleted if review is deleted Can be deleted by the creator. Deleted if SelectedDetail is deleted.
| `ConsensusValue` | An answer: number/text/date and/or selected options; belongs to a `Detail` and an `Item` ( Item + Detail) and holds most popular/average value from all contributors. Deleted if corresponding item or detail is deleted. |
| `OptionPersonalization` | Per-contributor tweak of an option (sentiment, disabled, position). they only affect that contributor’s personal experience and are invisible to others. Deleted if Option or Contributor is deleted. |
| `ValuePersonalization` | Per-contributor opinion(sentiment) of Contributor's Value. they only affect that contributor’s personal experience and are invisible to others..   Deleted if Value or Contributor is deleted. |





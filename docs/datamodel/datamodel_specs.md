## Domain model overview


(Example: )

This application allow to review anything. (Example: Wine)
Configurable Lists with custom Details(Questions/fields) allow to decribe any kind of reviewd item. (Example: List would have a name Wine)

User can join the list and become Contributer. 
User cannot see any info in the list apart from statistics (Number of contributors, items, reviews).
User can apply to enter the list and can be afutomatically accepted or with approval or with age confirmation. Thiw will be configured on the List page (Example: After answering "Are you over 21?" question)

List have details(Questions) which are visible to anyone (Example: Wine type, year, etc.) 
COntributer can add new details(Questions) to the list but not edit or delete them

List have SelectedDetail which are details that are used and or customized by the contributor. 
COntributer can drag details(Questions) to the seclectedDetails list the new  seclectedDetails will be created with link to detail(Question)
COntributer can cutomize Selected details (position, privacy, label display)

SelectedDetail will appear on the list's screen as SelectedDetail list, items screen and as a set of filters on Items screen

COntributer can add Item to the list 
Contributer can create a review by selecting predefined multiple choice (  FAVORITE, GOOD, OK, BAD, WISH_TO_TRY ) on the Item
Contributer can and answer all questions/details by selecting possible options or setting  descrete values 
Contributer can personalize option with  (sentiment, disabled, position) fields
Contributer can personalize Value with  (sentiment that corrspond to a number/text/date) fields
Sentiment is an int value from 1 to 5 that describe contributors opinion of something. 1 bad 5 good

Detail can be of type singleSelect,  number,  text,  tags,  date, location

Contributer cannot see peronalization of other contributors
Contributer cannot see reviews of other contributors
Contributer can see aggregate values counts of other contriobutors 

Item holds aggregate values of all reviews for this item

| Model | Purpose |
|---|---|
| `User` | Account; only `username`. Membership in lists goes through `Contributor`. |
| `Contributor` | Join entity between `User` and `List`, with a role (`OWNER`/`ADMIN`/`MEMBER`/`APPLICANT`) and saved screens configs. |
| `List` | A collection with name, contributors, items, and details. |
| `Item` | A thing being reviewed; item-level `attributes: [Value]`. |
| `Review` | A contributor's review of an item: a `ReviewLabel` plus a set of `Value`s. |
| `Detail` | A configurable question/attribute definition (type, number range, options). Belongs to a list. |
| `SelectedDetail` | Per-contributor customization of a `Detail` (position, privacy, label display). |
| `Option` | A choice for `singleSelect`/`tags` details. |
| `Value` | An answer: number/text/date and/or selected options; belongs to a `Review`
| `ConsensusValue` | An answer: number/text/date and/or selected options; belongs to a `Detail` and holds most popular value from all contributors
, and to a `Detail`. |
| `OptionPersonalization` | Per-contributor tweak of an option (sentiment, disabled, position). |
| `ValuePersonalization` | Per-contributor opinion(sentiment) of Contributor's Value or ConsensusValue. |



SelectedDetail is still half global and half per-contributor.
You define it as per-contributor customization, but you also say it appears on the list screen as a SelectedDetail list and as filters on the Items screen in datamodel_specs.md. If it is per-contributor, then every viewer has a different SelectedDetail set. If the list screen needs one shared SelectedDetail set, that should be a separate list-level model.

ConsensusValue does not have the right parent yet.
Right now it says it belongs to a Detail, but aggregate consensus usually depends on both Item and Detail, not just Detail. Otherwise “most popular wine year” would be global across the whole list rather than for one specific item.

ConsensusValue is only defined for “most popular value,” which works poorly for some detail types.
For singleSelect and tags, “most popular” is straightforward. For number, date, text, and location, it is not. You need to say whether consensus means mode, average, median, latest, normalized bucket, or something else. Without that, ConsensusValue is not well-defined.

ValuePersonalization still has an unclear target.
You now say it is an opinion of Contributor’s Value or ConsensusValue in datamodel_specs.md. That means one model points at two different kinds of things. That can work conceptually, but you need to choose how it is represented:
one foreign key to Value only,
one foreign key to ConsensusValue only,
or two nullable foreign keys with a rule that exactly one is set.

Value cardinality is still incomplete.
You now say Value belongs to a Review, which is clearer than before, but then Item-level attributes are no longer represented cleanly. The model table still says Item has item-level attributes, but Value no longer obviously covers them. You need one clear rule:
either item attributes are also Value rows with a different parent,
or item attributes are a separate model.

Review uniqueness is not specified.
Can one contributor create only one review per item, or many reviews over time? The sentence “create a review” suggests one, but the model does not say. This matters because it changes the natural key and how aggregates are computed.

The application flow is still described behaviorally, not as data.
You mention auto-accept, approval, and age confirmation, but the spec does not say where that state lives. That likely needs explicit list access settings plus an application or membership request record, or extra fields on Contributor.

Detail mutability rules are still inconsistent.
You say contributors can add details but not edit or delete them. That implies details are effectively immutable after creation. But then who can edit a bad label, wrong type, or duplicate detail? If admins can, say so. If no one can, that is a strong product rule and should be intentional.

Aggregate storage vs derived data is unclear.
You say “Item holds aggregate values of all reviews for this item” in datamodel_specs.md. That leaves one important question: is Item the source of truth for aggregates, or just a cached projection derived from reviews? If it is cached, that should be stated.

OptionPersonalization needs scope confirmation.
Fields like disabled and position sound like contributor-local UI preferences, which is fine. But if they affect review answering, you should say clearly that they only affect that contributor’s personal experience and are invisible to others.

If you want the shortest set of decisions needed to stabilize this model, I would resolve these first:

Is SelectedDetail shared per list or private per contributor?
Is there exactly one Review per contributor per item?
Does ConsensusValue belong to Item + Detail?
Are item attributes the same model as review values, or a separate model?
How is consensus defined for number, text, date, and location?
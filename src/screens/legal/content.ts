// DRAFT legal texts derived from docs/spec.md §12. They must be reviewed (ideally by a lawyer)
// and the [placeholders] filled in before release. Bump APP_TERMS_VERSION in src/data/profile.ts
// (and private.app_terms_version() in the database) whenever TERMS changes materially.

export type LegalDocument = {
  title: string;
  updated: string;
  draft: boolean;
  sections: { heading: string; paragraphs: string[] }[];
};

const CONTACT = '[contact email]';
const OPERATOR = '[operator name and address]';

export const TERMS: LegalDocument = {
  title: 'Terms of Use',
  updated: '2026-10-09',
  draft: true,
  sections: [
    {
      heading: 'Who can use Goods',
      paragraphs: [
        'You must be 16 or older to create an account. Some Lists set their own rules, such as a higher age limit or extra terms; you must meet them to join those Lists.',
      ],
    },
    {
      heading: 'Zero tolerance for objectionable content and abuse',
      paragraphs: [
        'Do not post content that is illegal, hateful, harassing, sexually explicit, violent or otherwise objectionable, and do not abuse other people. This applies to List names and terms, questions, options, item facts and photos.',
        'We act on reports within 24 hours. We may remove content and suspend accounts that break these rules. List admins may also remove members from their Lists.',
      ],
    },
    {
      heading: 'Your content',
      paragraphs: [
        'Your reviews and answers are private: other people see only combined results. Content you share with a List — items, their facts and photos, questions and options — belongs to that List and may stay after you leave, without your name attached.',
      ],
    },
    {
      heading: 'Reporting and blocking',
      paragraphs: [
        'You can report content from inside the app and block other users. You can contact us at ' + CONTACT + '.',
      ],
    },
    {
      heading: 'Ending your account',
      paragraphs: [
        'You can delete your account at any time in Settings or on our account-deletion page.',
      ],
    },
    {
      heading: 'Operator',
      paragraphs: ['Goods is operated by ' + OPERATOR + '.'],
    },
  ],
};

export const PRIVACY: LegalDocument = {
  title: 'Privacy Policy',
  updated: '2026-10-09',
  draft: true,
  sections: [
    {
      heading: 'What we collect',
      paragraphs: [
        'Your account: email address, sign-in provider (email, Apple or Google), username, and your confirmation that you are 16 or older.',
        'What you do in Lists: memberships, reviews, answers, your personal settings, and content you add (items, facts, photos, questions, options). Photo metadata such as location is removed when you upload.',
        'Moderation records: reports you file or that concern your content.',
      ],
    },
    {
      heading: 'Who can see it',
      paragraphs: [
        'Your reviews, answers and personal settings are visible only to you. Other members see combined results; answers you mark private never appear in counts and only influence results once enough people have answered.',
      ],
    },
    {
      heading: 'How long we keep it',
      paragraphs: [
        'Account data: until you delete your account.',
        'If you are banned from a List or suspended, your data in it is kept hidden for at most one year, then deleted — or immediately, if you delete your account.',
        'Resolved reports: one year after resolution.',
        'Deleted data leaves our backups and logs within 30 days.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'You can download all your data as a file from Settings, and delete your account in Settings or on our account-deletion page. You can also contact us at ' + CONTACT + ' to exercise your rights of access, correction, erasure and portability.',
      ],
    },
    {
      heading: 'Service providers',
      paragraphs: [
        'We store data with Supabase (database, file storage and sign-in) and host the website with Expo. Sign in with Apple and Google are handled by those companies under their own policies.',
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [OPERATOR + ' — ' + CONTACT],
    },
  ],
};

export const DELETE_ACCOUNT: LegalDocument = {
  title: 'Delete your account',
  updated: '2026-10-09',
  draft: true,
  sections: [
    {
      heading: 'In the app',
      paragraphs: [
        'Open Settings → Delete account and confirm. Deletion happens immediately.',
      ],
    },
    {
      heading: 'Without the app',
      paragraphs: [
        'Email ' + CONTACT + ' from the address you signed up with, asking us to delete your Goods account. We will confirm once it is done.',
      ],
    },
    {
      heading: 'What is deleted',
      paragraphs: [
        'Your account, username, sign-in details, reviews, answers, personal settings, photos you uploaded, reports you filed and blocks you made — including any data kept because of a ban.',
        'Shared List content other members rely on (items they reviewed, facts, options and questions they use) stays without your name attached. Deleted data leaves our backups within 30 days.',
      ],
    },
  ],
};

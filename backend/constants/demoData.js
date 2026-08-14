// Seed data for judge demo mode. All emails use the demo domain marker so
// clearDemoSubmissions() can wipe exactly these records and nothing else.
// AI fields are pre-baked (labelled assist-only in the UI) so judges see the
// full workflow instantly without waiting on a live model call.
const DEMO_SUBMISSIONS = [
  {
    name: 'Maya Okonkwo',
    email: 'maya@demo.sessionboard.local',
    bio: 'Staff engineer at a CDN provider; maintainer of two OSS observability tools.',
    talkTitle: 'Tracing Requests Across 40 Microservices Without Losing Your Mind',
    talkDescription:
      'Distributed tracing sounds great until you actually roll it out. This talk covers the three failed attempts before our successful one: sampling strategies that kept costs sane, context propagation across four languages, and the dashboards on-call engineers actually open.',
    status: 'Accepted',
    aiSuggestedScore: 9,
    aiRationale:
      'Concrete war-story framing with specific, transferable lessons. Strong practitioner signal from the bio and a clear audience takeaway.',
    aiSummary:
      'A practitioner recounts three failed distributed-tracing rollouts and the fourth that stuck. Covers sampling economics, cross-language context propagation, and dashboards designed for on-call use.',
    aiSuggestedTrack: 'Infrastructure & Observability',
    evaluatorScore: 9,
    evaluatorNotes: 'Headline talk material. Confirmed for main stage.',
    // Intentionally overlaps Tomás Rivera below (same day+room, overlapping
    // time) so the agenda's conflict detection + Auto-Resolve are visible
    // to judges from a fresh seed, not only after manual scheduling.
    sessionDay: '2026-09-15',
    sessionRoom: 'Room A',
    sessionStart: '10:00',
    sessionEnd: '10:45',
  },
  {
    name: 'Tomás Rivera',
    email: 'tomas@demo.sessionboard.local',
    bio: 'Security researcher; previously red team lead at a payments company.',
    talkTitle: 'Your CI Pipeline Is an Attack Surface',
    talkDescription:
      'A live-demo tour of real CI/CD compromises: poisoned caches, secrets exfiltration via pull-request builds, and dependency confusion. Each demo ends with the specific config change that would have stopped it.',
    status: 'Accepted',
    aiSuggestedScore: 8,
    aiRationale:
      'Live demos of real attack classes with paired mitigations. High relevance as supply-chain attacks keep making headlines.',
    aiSummary:
      'Live demonstrations of three real CI/CD attack classes, each paired with the concrete configuration change that prevents it. Practical security content aimed at every team that ships code.',
    aiSuggestedTrack: 'Security',
    evaluatorScore: 8,
    evaluatorNotes: 'Great demos. Needs AV check for the live portions.',
    sessionDay: '2026-09-15',
    sessionRoom: 'Room A',
    sessionStart: '10:30',
    sessionEnd: '11:15',
  },
  {
    name: 'Priya Nair',
    email: 'priya@demo.sessionboard.local',
    bio: 'Platform engineer; leads the internal developer platform team at a fintech.',
    talkTitle: 'Self-Service Infra Without the 2AM Pages',
    talkDescription:
      'How we built a golden-path platform that let product teams ship their own services without paging platform on-call. The abstractions that worked, the ones we had to walk back, and how we measured adoption.',
    status: 'Accepted',
    aiSuggestedScore: 8,
    aiRationale:
      'Strong platform-engineering case study with a clear before/after and measurable adoption story.',
    aiSummary:
      'A platform team built a golden-path internal developer platform that let product teams self-serve infrastructure without paging on-call. Covers the abstractions that worked and the ones that had to be walked back.',
    aiSuggestedTrack: 'Infrastructure & Observability',
    evaluatorScore: 8,
    evaluatorNotes: 'Accepted — still needs a room/time slot.',
    // Deliberately left unscheduled so the onboarding dashboard's "Accepted,
    // unscheduled" bucket and the "unscheduled" reminder are demoable.
  },
  {
    name: 'Owen Bradley',
    email: 'owen@demo.sessionboard.local',
    bio: '',
    talkTitle: 'Scaling Postgres Past a Billion Rows',
    talkDescription: '',
    status: 'Accepted',
    aiSuggestedScore: 7,
    aiRationale: 'Promising topic; bio and abstract still needed before publishing to the schedule.',
    aiSummary: 'Talk on scaling Postgres past a billion rows; full abstract pending from the speaker.',
    aiSuggestedTrack: 'Infrastructure & Observability',
    evaluatorScore: 7,
    evaluatorNotes: 'Accepted on the strength of the title + past talks. Waiting on bio and abstract.',
    // Scheduled but bio/talkDescription intentionally blank so the "Missing
    // materials" dashboard bucket and the "missingMaterials" reminder are
    // demoable from a fresh seed. Non-conflicting slot (different room).
    sessionDay: '2026-09-15',
    sessionRoom: 'Room B',
    sessionStart: '10:00',
    sessionEnd: '10:45',
  },
  {
    name: 'Grace Lindqvist',
    email: 'grace@demo.sessionboard.local',
    bio: 'Engineering manager turned IC; writes a popular newsletter on team topologies.',
    talkTitle: 'The Meeting That Replaced Our Standups',
    talkDescription:
      'We killed daily standups for a weekly written ritual and shipped faster. The format, the failure modes we hit in the first month, and the metrics that convinced our skeptical VP.',
    status: 'Under Review',
    aiSuggestedScore: 7,
    aiRationale:
      'Relatable process topic with a data-backed angle. Slightly narrower audience than technical talks but strong discussion potential.',
    aiSummary:
      'A team replaced daily standups with a weekly written ritual and improved shipping velocity. Covers the format, early failure modes, and the metrics that won over leadership.',
    aiSuggestedTrack: 'Leadership & Process',
  },
  {
    name: 'Dev Patel',
    email: 'dev@demo.sessionboard.local',
    bio: 'ML engineer working on retrieval systems; previously search infra at an e-commerce unicorn.',
    talkTitle: 'RAG Is a Data Pipeline Problem, Not a Model Problem',
    talkDescription:
      'Most retrieval-augmented generation failures trace back to ingestion: bad chunking, stale indexes, and silent embedding drift. A tour of the unglamorous pipeline work that took our answer quality from demo-grade to production-grade.',
    status: 'Under Review',
    aiSuggestedScore: 8,
    aiRationale:
      'Timely topic with a contrarian, experience-backed thesis. Clear production focus distinguishes it from the many intro-level RAG talks.',
    aiSummary:
      'Argues that most RAG quality failures are ingestion-pipeline problems — chunking, index freshness, embedding drift — rather than model problems. Draws on production search-infrastructure experience.',
    aiSuggestedTrack: 'AI & ML',
  },
  {
    name: 'Sofia Marchetti',
    email: 'sofia@demo.sessionboard.local',
    bio: 'Frontend developer; first-time conference speaker.',
    talkTitle: 'CSS Is Fun Again: A Tour of :has(), Container Queries, and View Transitions',
    talkDescription:
      'A rapid-fire, demo-heavy tour of modern CSS features that finally shipped everywhere, with before/after code for patterns that used to need JavaScript.',
    status: 'Submitted',
  },
  {
    name: 'Marcus Chen',
    email: 'marcus@demo.sessionboard.local',
    bio: 'Blogger.',
    talkTitle: 'Why Everything Is Broken',
    talkDescription: 'A rant about modern software. No slides needed, I will improvise.',
    status: 'Rejected',
    aiSuggestedScore: 3,
    aiRationale:
      'No concrete content, structure, or takeaways described. Improvised format is high-risk for a conference slot.',
    aiSummary:
      'An unstructured, improvised critique of modern software with no stated outline or takeaways. Little signal of preparation or audience value.',
    aiSuggestedTrack: 'General',
    evaluatorScore: 2,
    evaluatorNotes: 'Declined — no substance in the proposal.',
  },
];

module.exports = { DEMO_SUBMISSIONS };

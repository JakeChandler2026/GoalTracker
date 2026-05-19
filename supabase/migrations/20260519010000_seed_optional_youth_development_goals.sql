alter table public.goal_templates
  add column if not exists template_approved boolean not null default true,
  add column if not exists template_approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists template_approved_at timestamptz;
update public.goal_templates
set template_approved = true,
    template_approved_at = coalesce(template_approved_at, created_at)
where template_approved is distinct from true;
with seed_actor as (
  select id
  from public.profiles
  where role in ('administrator', 'bishop')
  order by case when role = 'administrator' then 0 else 1 end, created_at
  limit 1
), seed_templates (id, title, summary, difficulty, category, sort_order) as (
  values
    ('c58275e1-7379-52be-aff8-6c8950c23474'::uuid, 'Invite the Spirit by ending contention and practicing reconciliation in 6 situations', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, invite the Spirit by ending contention and practicing reconciliation in 6 situations.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 1),
    ('76a2249d-744e-51af-84e7-bd432b32720e'::uuid, 'Build spiritual momentum using 5 actions from the talk, completing 25 total action-checks', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, build spiritual momentum using 5 actions from the talk, completing 25 total action-checks.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 2),
    ('0f84a42a-a29f-5736-ba1f-a4ecf1016201'::uuid, 'Seek ''rest'' through covenant-centered worship by completing 20 quiet worship moments', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, seek ''rest'' through covenant-centered worship by completing 20 quiet worship moments.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 3),
    ('6a090ce1-a425-50a6-987f-7e55531e674c'::uuid, 'Let God prevail by choosing 15 ''God-first'' actions over competing influences', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, let God prevail by choosing 15 ''God-first'' actions over competing influences.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 4),
    ('4af1dbb6-959d-5a49-931a-6db34c4ba8ce'::uuid, 'Nourish testimony roots by focusing on faith in Jesus Christ 20 days', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish testimony roots by focusing on faith in Jesus Christ 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 5),
    ('a9761c6b-56ed-5a0b-b5fc-32339ca0c69e'::uuid, 'Exercise faith by acting on 8 promptings or righteous impressions', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, exercise faith by acting on 8 promptings or righteous impressions.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 6),
    ('b73a5101-b49c-5a2e-8dcd-0958703eecd2'::uuid, 'Rebuild trust in God through consistent worship and honest prayer 20 days', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, rebuild trust in God through consistent worship and honest prayer 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 7),
    ('f90b0bbc-d2f8-52ec-be16-266abd185247'::uuid, 'Follow promptings to minister by completing 8 Spirit-led acts of care', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, follow promptings to minister by completing 8 Spirit-led acts of care.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'spiritual'::public.goal_category, 8),
    ('7a1ea5a9-0e7c-5a98-9463-6e98cc151fbd'::uuid, 'Align speech with discipleship by using uplifting words 20 days', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, align speech with discipleship by using uplifting words 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'spiritual'::public.goal_category, 9),
    ('8534c858-b80d-574a-8357-a0e7a92caf66'::uuid, 'Make 12 decisions using an eternal perspective and record what you chose', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, make 12 decisions using an eternal perspective and record what you chose.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 10),
    ('0a1404d3-dd7f-5f20-9910-83e520a95089'::uuid, 'Invite the Spirit by ending contention and practicing reconciliation in 6 situations', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, invite the Spirit by ending contention and practicing reconciliation in 6 situations.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 11),
    ('2b0652a3-835e-5492-88e0-b862a744d29d'::uuid, 'Build spiritual momentum using 5 actions from the talk, completing 25 total action-checks', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, build spiritual momentum using 5 actions from the talk, completing 25 total action-checks.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 12),
    ('75f493b0-dbf2-5fab-9c4e-625c5a3fc700'::uuid, 'Seek ''rest'' through covenant-centered worship by completing 20 quiet worship moments', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, seek ''rest'' through covenant-centered worship by completing 20 quiet worship moments.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 13),
    ('f4f4954a-3b1c-569d-adac-52dbb64717ca'::uuid, 'Let God prevail by choosing 15 ''God-first'' actions over competing influences', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, let God prevail by choosing 15 ''God-first'' actions over competing influences.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 14),
    ('6c6ed091-664c-5046-af8a-62a8d3aa4849'::uuid, 'Nourish testimony roots by focusing on faith in Jesus Christ 20 days', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish testimony roots by focusing on faith in Jesus Christ 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 15),
    ('5734b865-f9e6-5db6-8ed1-43fbb27569c0'::uuid, 'Exercise faith by acting on 8 promptings or righteous impressions', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, exercise faith by acting on 8 promptings or righteous impressions.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 16),
    ('48404051-9680-5508-ae9f-32ffdbdbf39d'::uuid, 'Rebuild trust in God through consistent worship and honest prayer 20 days', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, rebuild trust in God through consistent worship and honest prayer 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 17),
    ('69d364a7-d038-5cb9-b93a-6d6fd9bb1a86'::uuid, 'Follow promptings to minister by completing 8 Spirit-led acts of care', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, follow promptings to minister by completing 8 Spirit-led acts of care.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'spiritual'::public.goal_category, 18),
    ('ada12eb6-9b10-58fe-aee6-dd80c3fed56b'::uuid, 'Align speech with discipleship by using uplifting words 20 days', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, align speech with discipleship by using uplifting words 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'spiritual'::public.goal_category, 19),
    ('6b1643e3-54e3-5500-a082-ff91aece2840'::uuid, 'Make 12 decisions using an eternal perspective and record what you chose', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, make 12 decisions using an eternal perspective and record what you chose.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 20),
    ('83cd304a-f324-547f-af0b-d0909a318476'::uuid, 'Invite the Spirit by ending contention and practicing reconciliation in 6 situations', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, invite the Spirit by ending contention and practicing reconciliation in 6 situations.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 21),
    ('bd89d9c1-81be-5828-8756-65b004d61d50'::uuid, 'Build spiritual momentum using 5 actions from the talk, completing 25 total action-checks', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, build spiritual momentum using 5 actions from the talk, completing 25 total action-checks.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 22),
    ('ae469d84-0a1a-59d1-8aae-8a6def94f2de'::uuid, 'Seek ''rest'' through covenant-centered worship by completing 20 quiet worship moments', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, seek ''rest'' through covenant-centered worship by completing 20 quiet worship moments.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 23),
    ('7ec0329c-b4c8-5ebf-bf13-e5bb12135f0d'::uuid, 'Let God prevail by choosing 15 ''God-first'' actions over competing influences', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, let God prevail by choosing 15 ''God-first'' actions over competing influences.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 24),
    ('1500e8a5-90bb-506a-9bfc-17452e0bc4aa'::uuid, 'Nourish testimony roots by focusing on faith in Jesus Christ 20 days', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish testimony roots by focusing on faith in Jesus Christ 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 25),
    ('3b913e75-3795-5afb-b30f-6e424182ebed'::uuid, 'Exercise faith by acting on 8 promptings or righteous impressions', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, exercise faith by acting on 8 promptings or righteous impressions.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 26),
    ('65b4452d-89e3-5520-a9fa-6e6ee6ace656'::uuid, 'Rebuild trust in God through consistent worship and honest prayer 20 days', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, rebuild trust in God through consistent worship and honest prayer 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 27),
    ('c173cf34-ba6d-5e50-8064-a4f22043b1cc'::uuid, 'Follow promptings to minister by completing 8 Spirit-led acts of care', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, follow promptings to minister by completing 8 Spirit-led acts of care.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'spiritual'::public.goal_category, 28),
    ('818fdc32-e3c6-59ae-916b-3080a5075522'::uuid, 'Align speech with discipleship by using uplifting words 20 days', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, align speech with discipleship by using uplifting words 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'spiritual'::public.goal_category, 29),
    ('e5cf2271-e899-5625-87bb-7880d5bd94db'::uuid, 'Make 12 decisions using an eternal perspective and record what you chose', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, make 12 decisions using an eternal perspective and record what you chose.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'spiritual'::public.goal_category, 30),
    ('30e8cf21-d9a1-5da6-b732-1e5b52f6b341'::uuid, 'Become a peacemaker by preventing or de-escalating conflict 10 times', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, become a peacemaker by preventing or de-escalating conflict 10 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 31),
    ('13a54353-2f84-5a11-9d75-504c25585e61'::uuid, 'Create momentum in kindness and unity with 20 actions that end conflict and build people', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, create momentum in kindness and unity with 20 actions that end conflict and build people.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'social'::public.goal_category, 32),
    ('7bad7934-d1ec-58de-9fb6-52b07f7ffe9c'::uuid, 'Help others feel rest by lifting burdens in 8 acts of ministering service', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, help others feel rest by lifting burdens in 8 acts of ministering service.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 33),
    ('242a18d2-b362-586d-93b5-15cffe532e4c'::uuid, 'Let God prevail in relationships by showing Christlike influence 12 times', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, let God prevail in relationships by showing Christlike influence 12 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'social'::public.goal_category, 34),
    ('96be24eb-4540-5fa0-9b3e-217db2bc5ffc'::uuid, 'Nourish relationship roots by building trust and respect 12 times', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish relationship roots by building trust and respect 12 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 35),
    ('1f60d834-a351-56d0-8b11-eaaf6a722d7e'::uuid, 'Show faith through courageous kindness in 10 situations', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, show faith through courageous kindness in 10 situations.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 36),
    ('a28718a9-18f4-52f5-aaa6-4ada913b49be'::uuid, 'Rebuild trust by being consistently trustworthy in 12 commitments', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, rebuild trust by being consistently trustworthy in 12 commitments.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 37),
    ('a10413bb-d7f7-5341-8876-f3a4ea83949c'::uuid, 'Minister like the Savior by helping 4 people feel seen and valued', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, minister like the Savior by helping 4 people feel seen and valued.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 38),
    ('4afe381d-726c-595d-8483-29bab69f0bc1'::uuid, 'Strengthen relationships through intentional words 25 times', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, strengthen relationships through intentional words 25 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'social'::public.goal_category, 39),
    ('b0ad556b-9a3c-553a-a83a-ac2af63df548'::uuid, 'Strengthen friendships by choosing ''celestial'' reactions in 10 social moments', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, strengthen friendships by choosing ''celestial'' reactions in 10 social moments.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 40),
    ('e0f49a44-7407-57e3-92c0-54bf6f7f85e0'::uuid, 'Become a peacemaker by preventing or de-escalating conflict 10 times', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, become a peacemaker by preventing or de-escalating conflict 10 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 41),
    ('97a4f4c2-c838-5b7d-a833-a2fe969ab418'::uuid, 'Create momentum in kindness and unity with 20 actions that end conflict and build people', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, create momentum in kindness and unity with 20 actions that end conflict and build people.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'social'::public.goal_category, 42),
    ('3f2d849b-ce55-5afd-be5d-22e8b8eeb7d1'::uuid, 'Help others feel rest by lifting burdens in 8 acts of ministering service', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, help others feel rest by lifting burdens in 8 acts of ministering service.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 43),
    ('88832e49-91f4-5a74-a6cc-02e0f7448b89'::uuid, 'Let God prevail in relationships by showing Christlike influence 12 times', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, let God prevail in relationships by showing Christlike influence 12 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'social'::public.goal_category, 44),
    ('9c0d863c-eb1c-50d0-9a73-31059819ffb4'::uuid, 'Nourish relationship roots by building trust and respect 12 times', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish relationship roots by building trust and respect 12 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 45),
    ('092577ed-bd90-5de6-aad7-df9717113a98'::uuid, 'Show faith through courageous kindness in 10 situations', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, show faith through courageous kindness in 10 situations.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 46),
    ('8536c76c-966a-5988-a77c-6665d022763a'::uuid, 'Rebuild trust by being consistently trustworthy in 12 commitments', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, rebuild trust by being consistently trustworthy in 12 commitments.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 47),
    ('b95297f5-c92a-5bb5-9a40-0576dfdc1bc6'::uuid, 'Minister like the Savior by helping 4 people feel seen and valued', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, minister like the Savior by helping 4 people feel seen and valued.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 48),
    ('d822d828-6ae2-528d-8861-3f8125bc213b'::uuid, 'Strengthen relationships through intentional words 25 times', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, strengthen relationships through intentional words 25 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'social'::public.goal_category, 49),
    ('e18d6226-ce69-5ce4-b27b-c68ec3c470c6'::uuid, 'Strengthen friendships by choosing ''celestial'' reactions in 10 social moments', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, strengthen friendships by choosing ''celestial'' reactions in 10 social moments.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 50),
    ('17df0be5-3549-502d-a436-5c1338db80df'::uuid, 'Become a peacemaker by preventing or de-escalating conflict 10 times', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, become a peacemaker by preventing or de-escalating conflict 10 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 51),
    ('a7eb1443-5946-5513-9601-d80f37f72a6c'::uuid, 'Create momentum in kindness and unity with 20 actions that end conflict and build people', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, create momentum in kindness and unity with 20 actions that end conflict and build people.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'social'::public.goal_category, 52),
    ('dad5d4f5-add5-5edd-a095-f7fa9f900d65'::uuid, 'Help others feel rest by lifting burdens in 8 acts of ministering service', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, help others feel rest by lifting burdens in 8 acts of ministering service.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 53),
    ('33f561d3-b8c7-53db-84cc-7f6f937e5c93'::uuid, 'Let God prevail in relationships by showing Christlike influence 12 times', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, let God prevail in relationships by showing Christlike influence 12 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'social'::public.goal_category, 54),
    ('96a90848-96db-5615-81a2-3cfda9467160'::uuid, 'Nourish relationship roots by building trust and respect 12 times', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish relationship roots by building trust and respect 12 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 55),
    ('62a524c4-5810-5bda-b628-e744aae143a1'::uuid, 'Show faith through courageous kindness in 10 situations', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, show faith through courageous kindness in 10 situations.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 56),
    ('6a30cc16-5fe9-5816-b45c-a8960a34525d'::uuid, 'Rebuild trust by being consistently trustworthy in 12 commitments', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, rebuild trust by being consistently trustworthy in 12 commitments.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 57),
    ('1f1d710c-703a-5a91-a1b9-a09a2933d95a'::uuid, 'Minister like the Savior by helping 4 people feel seen and valued', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, minister like the Savior by helping 4 people feel seen and valued.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 58),
    ('9b8cccd4-80b5-5c4c-b510-2a69fa52944f'::uuid, 'Strengthen relationships through intentional words 25 times', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, strengthen relationships through intentional words 25 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'social'::public.goal_category, 59),
    ('ea71adc0-5b70-5faa-9743-9cd33dc7b046'::uuid, 'Strengthen friendships by choosing ''celestial'' reactions in 10 social moments', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, strengthen friendships by choosing ''celestial'' reactions in 10 social moments.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'social'::public.goal_category, 60),
    ('3ce89d25-0435-5ee5-adf0-5b8fdcef5182'::uuid, 'Learn conflict skills and apply them in 6 real conversations', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, learn conflict skills and apply them in 6 real conversations.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 61),
    ('a6046c90-c4c2-597f-bc0a-a627e41c92a4'::uuid, 'Build learning momentum by completing a consistent study system 20 days', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, build learning momentum by completing a consistent study system 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'intellectual'::public.goal_category, 62),
    ('90cba8bd-f307-5577-84a0-b96e13bb802a'::uuid, 'Reduce overwhelm with an organized plan and complete 12 focused work sessions', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, reduce overwhelm with an organized plan and complete 12 focused work sessions.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 63),
    ('01c0328f-72e3-525b-b799-92da7c2a80f2'::uuid, 'Align learning goals with God''s priorities by completing a ''values-based goals'' sheet', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, align learning goals with God''s priorities by completing a ''values-based goals'' sheet.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 64),
    ('2b48cd98-ee24-5d5b-af82-0cc45e1d49b1'::uuid, 'Nourish learning roots by mastering fundamentals in one subject', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish learning roots by mastering fundamentals in one subject.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 65),
    ('cb81e863-95b3-5650-b4f7-4e72d5c04318'::uuid, '''move a mountain'' in school by improving one grade/skill measurably', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, ''move a mountain'' in school by improving one grade/skill measurably.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 66),
    ('cabb9966-ab0d-5aaf-9201-fb491812a64b'::uuid, 'Develop self-trust through a consistent learning routine 20 days', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, develop self-trust through a consistent learning routine 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'intellectual'::public.goal_category, 67),
    ('e0d02ed1-c29c-5b61-9383-5499ee03bb3c'::uuid, 'Learn to ''notice'' better by practicing observation and follow-through', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, learn to ''notice'' better by practicing observation and follow-through.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 68),
    ('9573011a-c930-5d21-a92b-6bd6a30703aa'::uuid, 'Improve communication skills by practicing clear, kind language in 10 messages', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, improve communication skills by practicing clear, kind language in 10 messages.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 69),
    ('21404e02-490c-5859-9121-d5a67effb31a'::uuid, 'Plan your future with eternal priorities and complete a 1-page ''life direction'' plan', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, plan your future with eternal priorities and complete a 1-page ''life direction'' plan.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 70),
    ('7ad196cf-3bca-5803-b790-bdccb301300d'::uuid, 'Learn conflict skills and apply them in 6 real conversations', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, learn conflict skills and apply them in 6 real conversations.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 71),
    ('e8b4bff2-bab1-5b78-87be-4843a1704f74'::uuid, 'Build learning momentum by completing a consistent study system 20 days', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, build learning momentum by completing a consistent study system 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'intellectual'::public.goal_category, 72),
    ('54315918-62fa-57b5-a604-16163b2a6c89'::uuid, 'Reduce overwhelm with an organized plan and complete 12 focused work sessions', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, reduce overwhelm with an organized plan and complete 12 focused work sessions.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 73),
    ('47ccaa7f-3c9e-5f92-9187-532ec82fe478'::uuid, 'Align learning goals with God''s priorities by completing a ''values-based goals'' sheet', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, align learning goals with God''s priorities by completing a ''values-based goals'' sheet.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 74),
    ('ab87c157-93db-54c9-b36d-a932b752a015'::uuid, 'Nourish learning roots by mastering fundamentals in one subject', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish learning roots by mastering fundamentals in one subject.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 75),
    ('fb582e51-20e0-5837-9350-adb1538f3605'::uuid, '''move a mountain'' in school by improving one grade/skill measurably', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, ''move a mountain'' in school by improving one grade/skill measurably.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 76),
    ('e3ebee23-823e-5512-80ba-35986f1048d3'::uuid, 'Develop self-trust through a consistent learning routine 20 days', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, develop self-trust through a consistent learning routine 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'intellectual'::public.goal_category, 77),
    ('e8201e88-5efc-5af8-bdb3-5a8427d0b556'::uuid, 'Learn to ''notice'' better by practicing observation and follow-through', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, learn to ''notice'' better by practicing observation and follow-through.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 78),
    ('ce8928e9-deb4-5fd8-8eb5-e899653b8381'::uuid, 'Improve communication skills by practicing clear, kind language in 10 messages', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, improve communication skills by practicing clear, kind language in 10 messages.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 79),
    ('fac8ae4b-b06d-5cb2-bbb1-6e3d3d3184a6'::uuid, 'Plan your future with eternal priorities and complete a 1-page ''life direction'' plan', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, plan your future with eternal priorities and complete a 1-page ''life direction'' plan.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 80),
    ('034cde29-3dc4-5027-836b-42e9375600ce'::uuid, 'Learn conflict skills and apply them in 6 real conversations', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, learn conflict skills and apply them in 6 real conversations.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 81),
    ('1f50c7f8-5bf8-5215-aef4-d3cee14cf7cc'::uuid, 'Build learning momentum by completing a consistent study system 20 days', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, build learning momentum by completing a consistent study system 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'intellectual'::public.goal_category, 82),
    ('d6e3d71f-1a85-5677-aa86-128e0ba11e4f'::uuid, 'Reduce overwhelm with an organized plan and complete 12 focused work sessions', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, reduce overwhelm with an organized plan and complete 12 focused work sessions.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 83),
    ('e8b3b5ac-0f12-5834-89a5-260fedb7447b'::uuid, 'Align learning goals with God''s priorities by completing a ''values-based goals'' sheet', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, align learning goals with God''s priorities by completing a ''values-based goals'' sheet.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 84),
    ('d7208591-0698-50b0-b6d2-e053023d2acd'::uuid, 'Nourish learning roots by mastering fundamentals in one subject', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish learning roots by mastering fundamentals in one subject.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 85),
    ('f35d6ae4-e29c-57c2-bfff-1453c0ea598d'::uuid, '''move a mountain'' in school by improving one grade/skill measurably', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, ''move a mountain'' in school by improving one grade/skill measurably.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 86),
    ('bec32dbd-4108-522e-88b7-066bcaf653c5'::uuid, 'Develop self-trust through a consistent learning routine 20 days', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, develop self-trust through a consistent learning routine 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'intellectual'::public.goal_category, 87),
    ('8faeabc5-3f41-5102-b59c-e5c67905c9d3'::uuid, 'Learn to ''notice'' better by practicing observation and follow-through', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, learn to ''notice'' better by practicing observation and follow-through.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 88),
    ('1132d1fe-5ed4-5f7a-b4fd-c4563ba6c1f4'::uuid, 'Improve communication skills by practicing clear, kind language in 10 messages', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, improve communication skills by practicing clear, kind language in 10 messages.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 89),
    ('ed37535d-5817-5a3d-9cc0-f0d6af14022c'::uuid, 'Plan your future with eternal priorities and complete a 1-page ''life direction'' plan', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, plan your future with eternal priorities and complete a 1-page ''life direction'' plan.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'intellectual'::public.goal_category, 90),
    ('8c057693-6fa4-5111-801f-41c5882d9ef3'::uuid, 'Reduce stress and tension by using physical calming tools in 12 conflict moments', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, reduce stress and tension by using physical calming tools in 12 conflict moments.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 91),
    ('c374cbb4-e635-5851-886c-cbd27afd7782'::uuid, 'Build physical momentum with consistent movement and recovery habits 20 days', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, build physical momentum with consistent movement and recovery habits 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'physical'::public.goal_category, 92),
    ('a175a369-c143-571c-88a5-d4769edb32dc'::uuid, 'Find physical rest by improving sleep and recovery for 14 days', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, find physical rest by improving sleep and recovery for 14 days.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 93),
    ('38e8918d-54cf-5eb5-9de5-d55a1423ab7a'::uuid, 'Let God prevail in body stewardship through 20 disciplined health choices', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, let God prevail in body stewardship through 20 disciplined health choices.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 94),
    ('288577e2-23ac-5002-b8ed-d42334d5e0b2'::uuid, 'Nourish physical roots by building foundational habits (sleep, food, movement)', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish physical roots by building foundational habits (sleep, food, movement).

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 95),
    ('4e8df75e-0da4-572f-89df-3581bfe39587'::uuid, 'Use faith + effort to improve a physical skill (endurance, strength, flexibility)', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, use faith + effort to improve a physical skill (endurance, strength, flexibility).

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'physical'::public.goal_category, 96),
    ('4ad451cb-faab-5d35-93d6-3522df15cfd9'::uuid, 'Build trust with your body through consistent routines (sleep/movement) 20 days', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, build trust with your body through consistent routines (sleep/movement) 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'physical'::public.goal_category, 97),
    ('604fd5c7-2a09-52a4-9816-8a3647b801f3'::uuid, 'Minister through physical service by completing 6 hands-on helps', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, minister through physical service by completing 6 hands-on helps.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'physical'::public.goal_category, 98),
    ('c694e475-623c-56fa-a29f-4290e6df3db2'::uuid, 'Reduce stress with healthier self-talk by replacing negative words 20 times', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, reduce stress with healthier self-talk by replacing negative words 20 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 99),
    ('06c41cd9-763f-50c1-b07a-0552d21d90d0'::uuid, 'Honor your body as part of your eternal destiny by completing 20 healthy choices', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, honor your body as part of your eternal destiny by completing 20 healthy choices.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 100),
    ('b5d8aff3-8f33-59f7-9aa4-caa701b29abf'::uuid, 'Reduce stress and tension by using physical calming tools in 12 conflict moments', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, reduce stress and tension by using physical calming tools in 12 conflict moments.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 101),
    ('3d1634c3-a216-5587-a56d-6f3def25ec3e'::uuid, 'Build physical momentum with consistent movement and recovery habits 20 days', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, build physical momentum with consistent movement and recovery habits 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'physical'::public.goal_category, 102),
    ('235aadf9-7be9-517a-99e2-6fa720aee755'::uuid, 'Find physical rest by improving sleep and recovery for 14 days', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, find physical rest by improving sleep and recovery for 14 days.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 103),
    ('6bbf9b43-6642-5c5b-b5b1-545f550895c4'::uuid, 'Let God prevail in body stewardship through 20 disciplined health choices', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, let God prevail in body stewardship through 20 disciplined health choices.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 104),
    ('7f3dd014-4f20-51a4-b30f-9558daf3e1af'::uuid, 'Nourish physical roots by building foundational habits (sleep, food, movement)', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish physical roots by building foundational habits (sleep, food, movement).

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 105),
    ('b50b4c45-2b2a-585e-b2bf-31efa51c9b61'::uuid, 'Use faith + effort to improve a physical skill (endurance, strength, flexibility)', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, use faith + effort to improve a physical skill (endurance, strength, flexibility).

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'physical'::public.goal_category, 106),
    ('13a385e9-d576-5682-b837-2768600e04dc'::uuid, 'Build trust with your body through consistent routines (sleep/movement) 20 days', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, build trust with your body through consistent routines (sleep/movement) 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'physical'::public.goal_category, 107),
    ('f8d7e2a3-2175-5fec-b47a-fd898f0cdd58'::uuid, 'Minister through physical service by completing 6 hands-on helps', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, minister through physical service by completing 6 hands-on helps.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'physical'::public.goal_category, 108),
    ('422a2ea3-910a-50a0-96d7-7ba3adfda69e'::uuid, 'Reduce stress with healthier self-talk by replacing negative words 20 times', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, reduce stress with healthier self-talk by replacing negative words 20 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 109),
    ('ae101129-988f-51b9-b2f0-6fad36db3198'::uuid, 'Honor your body as part of your eternal destiny by completing 20 healthy choices', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, honor your body as part of your eternal destiny by completing 20 healthy choices.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 110),
    ('cdd5622e-245c-54b4-8f6a-819bf8e7500f'::uuid, 'Reduce stress and tension by using physical calming tools in 12 conflict moments', 'Talk: Peacemakers Needed - President Russell M. Nelson (Apr 2023)

Principle: Choose reconciliation over contention; true disciples build peace even when it''s hard.

Measurable goal: For 28 days, reduce stress and tension by using physical calming tools in 12 conflict moments.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 111),
    ('b17bedc8-b760-5396-9add-71b437262421'::uuid, 'Build physical momentum with consistent movement and recovery habits 20 days', 'Talk: The Power of Spiritual Momentum - President Russell M. Nelson (Apr 2022)

Principle: Create positive spiritual momentum through daily actions like keeping covenants, repenting, learning of God, seeking miracles, and ending conflict.

Measurable goal: For 30 days, build physical momentum with consistent movement and recovery habits 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'physical'::public.goal_category, 112),
    ('a81d774f-6401-5f26-9b55-6cd8cf44cc36'::uuid, 'Find physical rest by improving sleep and recovery for 14 days', 'Talk: Overcome the World and Find Rest - President Russell M. Nelson (Oct 2022)

Principle: Find rest by yoking yourself to Jesus Christ through covenants; access His strength to overcome the world''s pressures.

Measurable goal: For 30 days, find physical rest by improving sleep and recovery for 14 days.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 113),
    ('9110b007-d63c-53e2-a4f4-fddb3dbf39f3'::uuid, 'Let God prevail in body stewardship through 20 disciplined health choices', 'Talk: Let God Prevail - President Russell M. Nelson (Oct 2020)

Principle: Let God be the most important influence in your life; choose identity and priorities that allow Him to prevail in your decisions.

Measurable goal: For 30 days, let God prevail in body stewardship through 20 disciplined health choices.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 114),
    ('3ecfd02c-719a-50a9-88d7-7809588fa91a'::uuid, 'Nourish physical roots by building foundational habits (sleep, food, movement)', 'Talk: Nourish the Roots, and the Branches Will Grow - Elder Dieter F. Uchtdorf (Oct 2024)

Principle: Strengthen the roots of testimony-faith in Heavenly Father and Jesus Christ-so questions and challenges don''t starve your spiritual life.

Measurable goal: For 30 days, nourish physical roots by building foundational habits (sleep, food, movement).

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 115),
    ('732eb0bf-b298-51cc-99b9-91a60fd5cab7'::uuid, 'Use faith + effort to improve a physical skill (endurance, strength, flexibility)', 'Talk: Christ Is Risen; Faith in Him Will Move Mountains - President Russell M. Nelson (Apr 2021)

Principle: Faith in Jesus Christ is a real power; exercise faith through action, persistence, and trust in the Savior.

Measurable goal: For 28 days, use faith + effort to improve a physical skill (endurance, strength, flexibility).

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'easy'::public.goal_difficulty, 'physical'::public.goal_category, 116),
    ('42dc4de4-b323-5641-beba-6bab09567c37'::uuid, 'Build trust with your body through consistent routines (sleep/movement) 20 days', 'Talk: Trust Again - Elder Gerrit W. Gong (Oct 2021)

Principle: Trust is an act of faith; as we trust God and choose trustworthy behavior, relationships heal and blessings come.

Measurable goal: For 30 days, build trust with your body through consistent routines (sleep/movement) 20 days.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'hard'::public.goal_difficulty, 'physical'::public.goal_category, 117),
    ('dee3c883-a83e-5435-89c6-ecc6ea4bf701'::uuid, 'Minister through physical service by completing 6 hands-on helps', 'Talk: Inspired Ministering - President Henry B. Eyring (Apr 2018)

Principle: Ministering is guided by love and the Holy Ghost-notice individuals, follow promptings, and act with real care.

Measurable goal: For 30 days, minister through physical service by completing 6 hands-on helps.

Reflection questions: Where did I notice the Spirit (or peace) more as I practiced this principle? | What did I learn about myself as I tried to live this message? | Who did this goal bless besides me?', 'easy'::public.goal_difficulty, 'physical'::public.goal_category, 118),
    ('1403b0a4-0e07-5914-8834-1c638196350a'::uuid, 'Reduce stress with healthier self-talk by replacing negative words 20 times', 'Talk: Words Matter - Elder Ronald A. Rasband (Apr 2024)

Principle: Words shape hearts and relationships; simple sincere phrases like "thank you," "I am sorry," and "I love you" can heal and strengthen.

Measurable goal: For 30 days, reduce stress with healthier self-talk by replacing negative words 20 times.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 119),
    ('8695cf9a-1324-56bc-a70c-700f469a710f'::uuid, 'Honor your body as part of your eternal destiny by completing 20 healthy choices', 'Talk: Think Celestial! - President Russell M. Nelson (Oct 2023)

Principle: Make choices with the celestial kingdom in mind; put Jesus Christ first when deciding what to do and who to become.

Measurable goal: For 30 days, honor your body as part of your eternal destiny by completing 20 healthy choices.

Reflection questions: What part of the principle felt easiest for me? What felt hardest? | What evidence did I see that living this principle brought more peace, strength, or clarity? | What one habit will I keep after this goal ends?', 'medium'::public.goal_difficulty, 'physical'::public.goal_category, 120)
)
insert into public.goal_templates (id, title, summary, points, difficulty, category, created_by, ward_id, template_approved, template_approved_by, template_approved_at)
select seed_templates.id, seed_templates.title, seed_templates.summary, 0, seed_templates.difficulty, seed_templates.category, seed_actor.id, null, false, null, null
from seed_templates
cross join seed_actor
on conflict (id) do update
set title = excluded.title,
    summary = excluded.summary,
    points = excluded.points,
    difficulty = excluded.difficulty,
    category = excluded.category,
    ward_id = excluded.ward_id,
    template_approved = public.goal_templates.template_approved;
delete from public.template_checklist_items
where template_id in (
  'c58275e1-7379-52be-aff8-6c8950c23474'::uuid,
  '76a2249d-744e-51af-84e7-bd432b32720e'::uuid,
  '0f84a42a-a29f-5736-ba1f-a4ecf1016201'::uuid,
  '6a090ce1-a425-50a6-987f-7e55531e674c'::uuid,
  '4af1dbb6-959d-5a49-931a-6db34c4ba8ce'::uuid,
  'a9761c6b-56ed-5a0b-b5fc-32339ca0c69e'::uuid,
  'b73a5101-b49c-5a2e-8dcd-0958703eecd2'::uuid,
  'f90b0bbc-d2f8-52ec-be16-266abd185247'::uuid,
  '7a1ea5a9-0e7c-5a98-9463-6e98cc151fbd'::uuid,
  '8534c858-b80d-574a-8357-a0e7a92caf66'::uuid,
  '0a1404d3-dd7f-5f20-9910-83e520a95089'::uuid,
  '2b0652a3-835e-5492-88e0-b862a744d29d'::uuid,
  '75f493b0-dbf2-5fab-9c4e-625c5a3fc700'::uuid,
  'f4f4954a-3b1c-569d-adac-52dbb64717ca'::uuid,
  '6c6ed091-664c-5046-af8a-62a8d3aa4849'::uuid,
  '5734b865-f9e6-5db6-8ed1-43fbb27569c0'::uuid,
  '48404051-9680-5508-ae9f-32ffdbdbf39d'::uuid,
  '69d364a7-d038-5cb9-b93a-6d6fd9bb1a86'::uuid,
  'ada12eb6-9b10-58fe-aee6-dd80c3fed56b'::uuid,
  '6b1643e3-54e3-5500-a082-ff91aece2840'::uuid,
  '83cd304a-f324-547f-af0b-d0909a318476'::uuid,
  'bd89d9c1-81be-5828-8756-65b004d61d50'::uuid,
  'ae469d84-0a1a-59d1-8aae-8a6def94f2de'::uuid,
  '7ec0329c-b4c8-5ebf-bf13-e5bb12135f0d'::uuid,
  '1500e8a5-90bb-506a-9bfc-17452e0bc4aa'::uuid,
  '3b913e75-3795-5afb-b30f-6e424182ebed'::uuid,
  '65b4452d-89e3-5520-a9fa-6e6ee6ace656'::uuid,
  'c173cf34-ba6d-5e50-8064-a4f22043b1cc'::uuid,
  '818fdc32-e3c6-59ae-916b-3080a5075522'::uuid,
  'e5cf2271-e899-5625-87bb-7880d5bd94db'::uuid,
  '30e8cf21-d9a1-5da6-b732-1e5b52f6b341'::uuid,
  '13a54353-2f84-5a11-9d75-504c25585e61'::uuid,
  '7bad7934-d1ec-58de-9fb6-52b07f7ffe9c'::uuid,
  '242a18d2-b362-586d-93b5-15cffe532e4c'::uuid,
  '96be24eb-4540-5fa0-9b3e-217db2bc5ffc'::uuid,
  '1f60d834-a351-56d0-8b11-eaaf6a722d7e'::uuid,
  'a28718a9-18f4-52f5-aaa6-4ada913b49be'::uuid,
  'a10413bb-d7f7-5341-8876-f3a4ea83949c'::uuid,
  '4afe381d-726c-595d-8483-29bab69f0bc1'::uuid,
  'b0ad556b-9a3c-553a-a83a-ac2af63df548'::uuid,
  'e0f49a44-7407-57e3-92c0-54bf6f7f85e0'::uuid,
  '97a4f4c2-c838-5b7d-a833-a2fe969ab418'::uuid,
  '3f2d849b-ce55-5afd-be5d-22e8b8eeb7d1'::uuid,
  '88832e49-91f4-5a74-a6cc-02e0f7448b89'::uuid,
  '9c0d863c-eb1c-50d0-9a73-31059819ffb4'::uuid,
  '092577ed-bd90-5de6-aad7-df9717113a98'::uuid,
  '8536c76c-966a-5988-a77c-6665d022763a'::uuid,
  'b95297f5-c92a-5bb5-9a40-0576dfdc1bc6'::uuid,
  'd822d828-6ae2-528d-8861-3f8125bc213b'::uuid,
  'e18d6226-ce69-5ce4-b27b-c68ec3c470c6'::uuid,
  '17df0be5-3549-502d-a436-5c1338db80df'::uuid,
  'a7eb1443-5946-5513-9601-d80f37f72a6c'::uuid,
  'dad5d4f5-add5-5edd-a095-f7fa9f900d65'::uuid,
  '33f561d3-b8c7-53db-84cc-7f6f937e5c93'::uuid,
  '96a90848-96db-5615-81a2-3cfda9467160'::uuid,
  '62a524c4-5810-5bda-b628-e744aae143a1'::uuid,
  '6a30cc16-5fe9-5816-b45c-a8960a34525d'::uuid,
  '1f1d710c-703a-5a91-a1b9-a09a2933d95a'::uuid,
  '9b8cccd4-80b5-5c4c-b510-2a69fa52944f'::uuid,
  'ea71adc0-5b70-5faa-9743-9cd33dc7b046'::uuid,
  '3ce89d25-0435-5ee5-adf0-5b8fdcef5182'::uuid,
  'a6046c90-c4c2-597f-bc0a-a627e41c92a4'::uuid,
  '90cba8bd-f307-5577-84a0-b96e13bb802a'::uuid,
  '01c0328f-72e3-525b-b799-92da7c2a80f2'::uuid,
  '2b48cd98-ee24-5d5b-af82-0cc45e1d49b1'::uuid,
  'cb81e863-95b3-5650-b4f7-4e72d5c04318'::uuid,
  'cabb9966-ab0d-5aaf-9201-fb491812a64b'::uuid,
  'e0d02ed1-c29c-5b61-9383-5499ee03bb3c'::uuid,
  '9573011a-c930-5d21-a92b-6bd6a30703aa'::uuid,
  '21404e02-490c-5859-9121-d5a67effb31a'::uuid,
  '7ad196cf-3bca-5803-b790-bdccb301300d'::uuid,
  'e8b4bff2-bab1-5b78-87be-4843a1704f74'::uuid,
  '54315918-62fa-57b5-a604-16163b2a6c89'::uuid,
  '47ccaa7f-3c9e-5f92-9187-532ec82fe478'::uuid,
  'ab87c157-93db-54c9-b36d-a932b752a015'::uuid,
  'fb582e51-20e0-5837-9350-adb1538f3605'::uuid,
  'e3ebee23-823e-5512-80ba-35986f1048d3'::uuid,
  'e8201e88-5efc-5af8-bdb3-5a8427d0b556'::uuid,
  'ce8928e9-deb4-5fd8-8eb5-e899653b8381'::uuid,
  'fac8ae4b-b06d-5cb2-bbb1-6e3d3d3184a6'::uuid,
  '034cde29-3dc4-5027-836b-42e9375600ce'::uuid,
  '1f50c7f8-5bf8-5215-aef4-d3cee14cf7cc'::uuid,
  'd6e3d71f-1a85-5677-aa86-128e0ba11e4f'::uuid,
  'e8b3b5ac-0f12-5834-89a5-260fedb7447b'::uuid,
  'd7208591-0698-50b0-b6d2-e053023d2acd'::uuid,
  'f35d6ae4-e29c-57c2-bfff-1453c0ea598d'::uuid,
  'bec32dbd-4108-522e-88b7-066bcaf653c5'::uuid,
  '8faeabc5-3f41-5102-b59c-e5c67905c9d3'::uuid,
  '1132d1fe-5ed4-5f7a-b4fd-c4563ba6c1f4'::uuid,
  'ed37535d-5817-5a3d-9cc0-f0d6af14022c'::uuid,
  '8c057693-6fa4-5111-801f-41c5882d9ef3'::uuid,
  'c374cbb4-e635-5851-886c-cbd27afd7782'::uuid,
  'a175a369-c143-571c-88a5-d4769edb32dc'::uuid,
  '38e8918d-54cf-5eb5-9de5-d55a1423ab7a'::uuid,
  '288577e2-23ac-5002-b8ed-d42334d5e0b2'::uuid,
  '4e8df75e-0da4-572f-89df-3581bfe39587'::uuid,
  '4ad451cb-faab-5d35-93d6-3522df15cfd9'::uuid,
  '604fd5c7-2a09-52a4-9816-8a3647b801f3'::uuid,
  'c694e475-623c-56fa-a29f-4290e6df3db2'::uuid,
  '06c41cd9-763f-50c1-b07a-0552d21d90d0'::uuid,
  'b5d8aff3-8f33-59f7-9aa4-caa701b29abf'::uuid,
  '3d1634c3-a216-5587-a56d-6f3def25ec3e'::uuid,
  '235aadf9-7be9-517a-99e2-6fa720aee755'::uuid,
  '6bbf9b43-6642-5c5b-b5b1-545f550895c4'::uuid,
  '7f3dd014-4f20-51a4-b30f-9558daf3e1af'::uuid,
  'b50b4c45-2b2a-585e-b2bf-31efa51c9b61'::uuid,
  '13a385e9-d576-5682-b837-2768600e04dc'::uuid,
  'f8d7e2a3-2175-5fec-b47a-fd898f0cdd58'::uuid,
  '422a2ea3-910a-50a0-96d7-7ba3adfda69e'::uuid,
  'ae101129-988f-51b9-b2f0-6fad36db3198'::uuid,
  'cdd5622e-245c-54b4-8f6a-819bf8e7500f'::uuid,
  'b17bedc8-b760-5396-9add-71b437262421'::uuid,
  'a81d774f-6401-5f26-9b55-6cd8cf44cc36'::uuid,
  '9110b007-d63c-53e2-a4f4-fddb3dbf39f3'::uuid,
  '3ecfd02c-719a-50a9-88d7-7809588fa91a'::uuid,
  '732eb0bf-b298-51cc-99b9-91a60fd5cab7'::uuid,
  '42dc4de4-b323-5641-beba-6bab09567c37'::uuid,
  'dee3c883-a83e-5435-89c6-ecc6ea4bf701'::uuid,
  '1403b0a4-0e07-5914-8834-1c638196350a'::uuid,
  '8695cf9a-1324-56bc-a70c-700f469a710f'::uuid
);
with seed_items (template_id, title, repeat_count, sort_order) as (
  values
  ('c58275e1-7379-52be-aff8-6c8950c23474'::uuid, 'Pray for a peacemaker heart on 15 days (track).', 15, 0),
  ('c58275e1-7379-52be-aff8-6c8950c23474'::uuid, 'Use the ''pause and soften'' rule in 12 tense moments: pause 5 seconds and respond calmly (track 12).', 12, 1),
  ('c58275e1-7379-52be-aff8-6c8950c23474'::uuid, 'Repair or strengthen 2 relationships: one apology and one forgiveness step (2 actions).', 2, 2),
  ('76a2249d-744e-51af-84e7-bd432b32720e'::uuid, 'Keep covenants with a sacrament focus note weekly (4 notes).', 4, 0),
  ('76a2249d-744e-51af-84e7-bd432b32720e'::uuid, 'Repent daily: write one ''I will improve'' line on 20 days (20).', 20, 1),
  ('76a2249d-744e-51af-84e7-bd432b32720e'::uuid, 'Seek miracles: record 1 miracle/mercies entry each week (4). (add a short note about what you learned each time).', 4, 2),
  ('0f84a42a-a29f-5736-ba1f-a4ecf1016201'::uuid, 'Do 10 minutes of quiet worship (prayer/scripture) 20 days (track 20).', 20, 0),
  ('0f84a42a-a29f-5736-ba1f-a4ecf1016201'::uuid, 'Write 4 ''yoke with the Savior'' entries-what burden you gave Him and what you did next (4).', 4, 1),
  ('0f84a42a-a29f-5736-ba1f-a4ecf1016201'::uuid, 'Strengthen covenant living: choose 1 covenant-related habit and keep it 20/30 days (track).', 1, 2),
  ('6a090ce1-a425-50a6-987f-7e55531e674c'::uuid, 'Identify 3 competing influences (media, friends, pride, laziness) and write how you''ll put God first.', 3, 0),
  ('6a090ce1-a425-50a6-987f-7e55531e674c'::uuid, 'Choose ''God-first'' actions 15 times (prayer, scripture, obedience, repentance) and track (15).', 15, 1),
  ('6a090ce1-a425-50a6-987f-7e55531e674c'::uuid, 'Do one ''gather Israel'' action weekly: invite, share, serve, strengthen (4 actions).', 4, 2),
  ('6a090ce1-a425-50a6-987f-7e55531e674c'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('4af1dbb6-959d-5a49-931a-6db34c4ba8ce'::uuid, 'Study 20 days: 10 minutes focusing on Jesus Christ (track 20).', 20, 0),
  ('4af1dbb6-959d-5a49-931a-6db34c4ba8ce'::uuid, 'When a question comes, respond with a ''root action'': pray, study, act, ask for help (do 6 times).', 6, 1),
  ('4af1dbb6-959d-5a49-931a-6db34c4ba8ce'::uuid, 'Write 4 weekly root reflections: what strengthened faith this week? (4).', 4, 2),
  ('a9761c6b-56ed-5a0b-b5fc-32339ca0c69e'::uuid, 'Pray for guidance 12 days and write one line about what you felt (12).', 12, 0),
  ('a9761c6b-56ed-5a0b-b5fc-32339ca0c69e'::uuid, 'Act on 8 impressions (serve, repent, study, apologize) and record outcome (8).', 8, 1),
  ('a9761c6b-56ed-5a0b-b5fc-32339ca0c69e'::uuid, 'Choose one ''mountain'' (fear, temptation, doubt) and take 4 weekly steps (4).', 4, 2),
  ('b73a5101-b49c-5a2e-8dcd-0958703eecd2'::uuid, 'Pray honestly 20 days (track).', 20, 0),
  ('b73a5101-b49c-5a2e-8dcd-0958703eecd2'::uuid, 'Study 8 times about God''s character (mercy, patience, love) from scripture/talks (8).', 8, 1),
  ('b73a5101-b49c-5a2e-8dcd-0958703eecd2'::uuid, 'Write 4 trust reflections: where did I choose trust this week? (4). (add a short note about what you learned each time).', 4, 2),
  ('f90b0bbc-d2f8-52ec-be16-266abd185247'::uuid, 'Pray 10 days to notice who needs you (10).', 10, 0),
  ('f90b0bbc-d2f8-52ec-be16-266abd185247'::uuid, 'Act on 8 impressions to help someone (text, help, listen, include) (8).', 8, 1),
  ('f90b0bbc-d2f8-52ec-be16-266abd185247'::uuid, 'Write 4 weekly notes: what did you learn about love and the Spirit? (4).', 4, 2),
  ('7a1ea5a9-0e7c-5a98-9463-6e98cc151fbd'::uuid, 'Say one sincere prayer of gratitude daily for 14 days and write one ''thank you'' you offered (14).', 14, 0),
  ('7a1ea5a9-0e7c-5a98-9463-6e98cc151fbd'::uuid, 'Use ''I am sorry'' appropriately at least 3 times (3).', 3, 1),
  ('7a1ea5a9-0e7c-5a98-9463-6e98cc151fbd'::uuid, 'Share testimony/uplifting words 4 times (family, class, friend) (4).', 4, 2),
  ('7a1ea5a9-0e7c-5a98-9463-6e98cc151fbd'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('8534c858-b80d-574a-8357-a0e7a92caf66'::uuid, 'Use a 3-question check before 12 decisions: (1) Does this invite the Spirit? (2) Will I be glad I chose this in 10 years? (3) Does this put Christ first? (track 12)', 1, 0),
  ('8534c858-b80d-574a-8357-a0e7a92caf66'::uuid, 'Study one paragraph or key idea from the talk on 10 days and write one sentence of application each time (10 entries).', 10, 1),
  ('8534c858-b80d-574a-8357-a0e7a92caf66'::uuid, 'Choose one recurring habit to align with eternal goals (prayer, scripture, Sabbath focus) and do it 20/30 days (track).', 20, 2),
  ('0a1404d3-dd7f-5f20-9910-83e520a95089'::uuid, 'Pray for a peacemaker heart on 15 days (track).', 15, 0),
  ('0a1404d3-dd7f-5f20-9910-83e520a95089'::uuid, 'Use the ''pause and soften'' rule in 12 tense moments: pause 5 seconds and respond calmly (track 12).', 12, 1),
  ('0a1404d3-dd7f-5f20-9910-83e520a95089'::uuid, 'Repair or strengthen 2 relationships: one apology and one forgiveness step (2 actions).', 2, 2),
  ('2b0652a3-835e-5492-88e0-b862a744d29d'::uuid, 'Keep covenants with a sacrament focus note weekly (4 notes).', 4, 0),
  ('2b0652a3-835e-5492-88e0-b862a744d29d'::uuid, 'Repent daily: write one ''I will improve'' line on 20 days (20).', 20, 1),
  ('2b0652a3-835e-5492-88e0-b862a744d29d'::uuid, 'Seek miracles: record 1 miracle/mercies entry each week (4). (add a short note about what you learned each time).', 4, 2),
  ('75f493b0-dbf2-5fab-9c4e-625c5a3fc700'::uuid, 'Do 10 minutes of quiet worship (prayer/scripture) 20 days (track 20).', 20, 0),
  ('75f493b0-dbf2-5fab-9c4e-625c5a3fc700'::uuid, 'Write 4 ''yoke with the Savior'' entries-what burden you gave Him and what you did next (4).', 4, 1),
  ('75f493b0-dbf2-5fab-9c4e-625c5a3fc700'::uuid, 'Strengthen covenant living: choose 1 covenant-related habit and keep it 20/30 days (track).', 1, 2),
  ('f4f4954a-3b1c-569d-adac-52dbb64717ca'::uuid, 'Identify 3 competing influences (media, friends, pride, laziness) and write how you''ll put God first.', 3, 0),
  ('f4f4954a-3b1c-569d-adac-52dbb64717ca'::uuid, 'Choose ''God-first'' actions 15 times (prayer, scripture, obedience, repentance) and track (15).', 15, 1),
  ('f4f4954a-3b1c-569d-adac-52dbb64717ca'::uuid, 'Do one ''gather Israel'' action weekly: invite, share, serve, strengthen (4 actions).', 4, 2),
  ('f4f4954a-3b1c-569d-adac-52dbb64717ca'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('6c6ed091-664c-5046-af8a-62a8d3aa4849'::uuid, 'Study 20 days: 10 minutes focusing on Jesus Christ (track 20).', 20, 0),
  ('6c6ed091-664c-5046-af8a-62a8d3aa4849'::uuid, 'When a question comes, respond with a ''root action'': pray, study, act, ask for help (do 6 times).', 6, 1),
  ('6c6ed091-664c-5046-af8a-62a8d3aa4849'::uuid, 'Write 4 weekly root reflections: what strengthened faith this week? (4).', 4, 2),
  ('5734b865-f9e6-5db6-8ed1-43fbb27569c0'::uuid, 'Pray for guidance 12 days and write one line about what you felt (12).', 12, 0),
  ('5734b865-f9e6-5db6-8ed1-43fbb27569c0'::uuid, 'Act on 8 impressions (serve, repent, study, apologize) and record outcome (8).', 8, 1),
  ('5734b865-f9e6-5db6-8ed1-43fbb27569c0'::uuid, 'Choose one ''mountain'' (fear, temptation, doubt) and take 4 weekly steps (4).', 4, 2),
  ('48404051-9680-5508-ae9f-32ffdbdbf39d'::uuid, 'Pray honestly 20 days (track).', 20, 0),
  ('48404051-9680-5508-ae9f-32ffdbdbf39d'::uuid, 'Study 8 times about God''s character (mercy, patience, love) from scripture/talks (8).', 8, 1),
  ('48404051-9680-5508-ae9f-32ffdbdbf39d'::uuid, 'Write 4 trust reflections: where did I choose trust this week? (4). (add a short note about what you learned each time).', 4, 2),
  ('69d364a7-d038-5cb9-b93a-6d6fd9bb1a86'::uuid, 'Pray 10 days to notice who needs you (10).', 10, 0),
  ('69d364a7-d038-5cb9-b93a-6d6fd9bb1a86'::uuid, 'Act on 8 impressions to help someone (text, help, listen, include) (8).', 8, 1),
  ('69d364a7-d038-5cb9-b93a-6d6fd9bb1a86'::uuid, 'Write 4 weekly notes: what did you learn about love and the Spirit? (4).', 4, 2),
  ('ada12eb6-9b10-58fe-aee6-dd80c3fed56b'::uuid, 'Say one sincere prayer of gratitude daily for 14 days and write one ''thank you'' you offered (14).', 14, 0),
  ('ada12eb6-9b10-58fe-aee6-dd80c3fed56b'::uuid, 'Use ''I am sorry'' appropriately at least 3 times (3).', 3, 1),
  ('ada12eb6-9b10-58fe-aee6-dd80c3fed56b'::uuid, 'Share testimony/uplifting words 4 times (family, class, friend) (4).', 4, 2),
  ('ada12eb6-9b10-58fe-aee6-dd80c3fed56b'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('6b1643e3-54e3-5500-a082-ff91aece2840'::uuid, 'Use a 3-question check before 12 decisions: (1) Does this invite the Spirit? (2) Will I be glad I chose this in 10 years? (3) Does this put Christ first? (track 12)', 1, 0),
  ('6b1643e3-54e3-5500-a082-ff91aece2840'::uuid, 'Study one paragraph or key idea from the talk on 10 days and write one sentence of application each time (10 entries).', 10, 1),
  ('6b1643e3-54e3-5500-a082-ff91aece2840'::uuid, 'Choose one recurring habit to align with eternal goals (prayer, scripture, Sabbath focus) and do it 20/30 days (track).', 20, 2),
  ('83cd304a-f324-547f-af0b-d0909a318476'::uuid, 'Pray for a peacemaker heart on 15 days (track).', 15, 0),
  ('83cd304a-f324-547f-af0b-d0909a318476'::uuid, 'Use the ''pause and soften'' rule in 12 tense moments: pause 5 seconds and respond calmly (track 12).', 12, 1),
  ('83cd304a-f324-547f-af0b-d0909a318476'::uuid, 'Repair or strengthen 2 relationships: one apology and one forgiveness step (2 actions).', 2, 2),
  ('bd89d9c1-81be-5828-8756-65b004d61d50'::uuid, 'Keep covenants with a sacrament focus note weekly (4 notes).', 4, 0),
  ('bd89d9c1-81be-5828-8756-65b004d61d50'::uuid, 'Repent daily: write one ''I will improve'' line on 20 days (20).', 20, 1),
  ('bd89d9c1-81be-5828-8756-65b004d61d50'::uuid, 'Seek miracles: record 1 miracle/mercies entry each week (4). (add a short note about what you learned each time).', 4, 2),
  ('ae469d84-0a1a-59d1-8aae-8a6def94f2de'::uuid, 'Do 10 minutes of quiet worship (prayer/scripture) 20 days (track 20).', 20, 0),
  ('ae469d84-0a1a-59d1-8aae-8a6def94f2de'::uuid, 'Write 4 ''yoke with the Savior'' entries-what burden you gave Him and what you did next (4).', 4, 1),
  ('ae469d84-0a1a-59d1-8aae-8a6def94f2de'::uuid, 'Strengthen covenant living: choose 1 covenant-related habit and keep it 20/30 days (track).', 1, 2),
  ('7ec0329c-b4c8-5ebf-bf13-e5bb12135f0d'::uuid, 'Identify 3 competing influences (media, friends, pride, laziness) and write how you''ll put God first.', 3, 0),
  ('7ec0329c-b4c8-5ebf-bf13-e5bb12135f0d'::uuid, 'Choose ''God-first'' actions 15 times (prayer, scripture, obedience, repentance) and track (15).', 15, 1),
  ('7ec0329c-b4c8-5ebf-bf13-e5bb12135f0d'::uuid, 'Do one ''gather Israel'' action weekly: invite, share, serve, strengthen (4 actions).', 4, 2),
  ('7ec0329c-b4c8-5ebf-bf13-e5bb12135f0d'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('1500e8a5-90bb-506a-9bfc-17452e0bc4aa'::uuid, 'Study 20 days: 10 minutes focusing on Jesus Christ (track 20).', 20, 0),
  ('1500e8a5-90bb-506a-9bfc-17452e0bc4aa'::uuid, 'When a question comes, respond with a ''root action'': pray, study, act, ask for help (do 6 times).', 6, 1),
  ('1500e8a5-90bb-506a-9bfc-17452e0bc4aa'::uuid, 'Write 4 weekly root reflections: what strengthened faith this week? (4).', 4, 2),
  ('3b913e75-3795-5afb-b30f-6e424182ebed'::uuid, 'Pray for guidance 12 days and write one line about what you felt (12).', 12, 0),
  ('3b913e75-3795-5afb-b30f-6e424182ebed'::uuid, 'Act on 8 impressions (serve, repent, study, apologize) and record outcome (8).', 8, 1),
  ('3b913e75-3795-5afb-b30f-6e424182ebed'::uuid, 'Choose one ''mountain'' (fear, temptation, doubt) and take 4 weekly steps (4).', 4, 2),
  ('65b4452d-89e3-5520-a9fa-6e6ee6ace656'::uuid, 'Pray honestly 20 days (track).', 20, 0),
  ('65b4452d-89e3-5520-a9fa-6e6ee6ace656'::uuid, 'Study 8 times about God''s character (mercy, patience, love) from scripture/talks (8).', 8, 1),
  ('65b4452d-89e3-5520-a9fa-6e6ee6ace656'::uuid, 'Write 4 trust reflections: where did I choose trust this week? (4). (add a short note about what you learned each time).', 4, 2),
  ('c173cf34-ba6d-5e50-8064-a4f22043b1cc'::uuid, 'Pray 10 days to notice who needs you (10).', 10, 0),
  ('c173cf34-ba6d-5e50-8064-a4f22043b1cc'::uuid, 'Act on 8 impressions to help someone (text, help, listen, include) (8).', 8, 1),
  ('c173cf34-ba6d-5e50-8064-a4f22043b1cc'::uuid, 'Write 4 weekly notes: what did you learn about love and the Spirit? (4).', 4, 2),
  ('818fdc32-e3c6-59ae-916b-3080a5075522'::uuid, 'Say one sincere prayer of gratitude daily for 14 days and write one ''thank you'' you offered (14).', 14, 0),
  ('818fdc32-e3c6-59ae-916b-3080a5075522'::uuid, 'Use ''I am sorry'' appropriately at least 3 times (3).', 3, 1),
  ('818fdc32-e3c6-59ae-916b-3080a5075522'::uuid, 'Share testimony/uplifting words 4 times (family, class, friend) (4).', 4, 2),
  ('818fdc32-e3c6-59ae-916b-3080a5075522'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('e5cf2271-e899-5625-87bb-7880d5bd94db'::uuid, 'Use a 3-question check before 12 decisions: (1) Does this invite the Spirit? (2) Will I be glad I chose this in 10 years? (3) Does this put Christ first? (track 12)', 1, 0),
  ('e5cf2271-e899-5625-87bb-7880d5bd94db'::uuid, 'Study one paragraph or key idea from the talk on 10 days and write one sentence of application each time (10 entries).', 10, 1),
  ('e5cf2271-e899-5625-87bb-7880d5bd94db'::uuid, 'Choose one recurring habit to align with eternal goals (prayer, scripture, Sabbath focus) and do it 20/30 days (track).', 20, 2),
  ('30e8cf21-d9a1-5da6-b732-1e5b52f6b341'::uuid, 'Memorize 3 peacemaker phrases (e.g., "Help me understand," "I''m sorry," "Let''s fix this") and use them 10 times (track).', 3, 0),
  ('30e8cf21-d9a1-5da6-b732-1e5b52f6b341'::uuid, 'Avoid gossip for 14 days by using a ''redirect'' strategy when negativity starts (track 14).', 14, 1),
  ('30e8cf21-d9a1-5da6-b732-1e5b52f6b341'::uuid, 'Do 4 bridge-building acts: include someone, encourage someone, reconcile, or defend someone kindly (4).', 4, 2),
  ('13a54353-2f84-5a11-9d75-504c25585e61'::uuid, 'Do 10 small kindness actions (help, include, encourage) and list them (10).', 10, 0),
  ('13a54353-2f84-5a11-9d75-504c25585e61'::uuid, 'End conflict: choose one conflict pattern to stop (sarcasm, snapping) and track 12 successful stops (12).', 12, 1),
  ('13a54353-2f84-5a11-9d75-504c25585e61'::uuid, 'Serve in a way that strengthens your group (family, quorum/class, team) 4 times (4). (add a short note about what you learned each time).', 4, 2),
  ('7bad7934-d1ec-58de-9fb6-52b07f7ffe9c'::uuid, 'Identify 2 people who seem stressed and list 2 ways to help each (plan).', 2, 0),
  ('7bad7934-d1ec-58de-9fb6-52b07f7ffe9c'::uuid, 'Complete 8 burden-lifting actions (listen, help, include, encourage) and record (8).', 8, 1),
  ('7bad7934-d1ec-58de-9fb6-52b07f7ffe9c'::uuid, 'Reduce ''pressure language'': replace 10 negative comments with supportive words (track 10).', 10, 2),
  ('242a18d2-b362-586d-93b5-15cffe532e4c'::uuid, 'Set one boundary that keeps you faithful (language, media, group chats) and keep it for 30 days (track).', 30, 0),
  ('242a18d2-b362-586d-93b5-15cffe532e4c'::uuid, 'Do 8 ''light'' actions: defend someone, include someone, encourage someone, refuse gossip (8).', 8, 1),
  ('242a18d2-b362-586d-93b5-15cffe532e4c'::uuid, 'Invite one person toward good: church activity, family night, uplifting talk, or prayer (1 invite + follow-up).', 1, 2),
  ('242a18d2-b362-586d-93b5-15cffe532e4c'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('96be24eb-4540-5fa0-9b3e-217db2bc5ffc'::uuid, 'Do 6 ''trust deposits'': keep promises, be on time, do chores without reminders (6).', 6, 0),
  ('96be24eb-4540-5fa0-9b3e-217db2bc5ffc'::uuid, 'Say 6 ''root words'': thank you, I''m sorry, I love you, or sincere praise (6).', 6, 1),
  ('96be24eb-4540-5fa0-9b3e-217db2bc5ffc'::uuid, 'Have 2 honest conversations to strengthen understanding (2).', 2, 2),
  ('1f60d834-a351-56d0-8b11-eaaf6a722d7e'::uuid, 'Do 6 courageous kindness acts (stand up for someone, include someone, tell truth kindly) (6).', 6, 0),
  ('1f60d834-a351-56d0-8b11-eaaf6a722d7e'::uuid, 'Invite one person into your circle 4 times (4).', 4, 1),
  ('1f60d834-a351-56d0-8b11-eaaf6a722d7e'::uuid, 'Write 2 reflections: how did faith change your courage? (2).', 2, 2),
  ('a28718a9-18f4-52f5-aaa6-4ada913b49be'::uuid, 'Make 12 small promises you can keep (chores, messages, being on time) and track each kept promise (12).', 12, 0),
  ('a28718a9-18f4-52f5-aaa6-4ada913b49be'::uuid, 'Repair one trust break: apologize + make a plan to change (1).', 1, 1),
  ('a28718a9-18f4-52f5-aaa6-4ada913b49be'::uuid, 'Ask one person: ''How can I be more trustworthy?'' and act on one suggestion (1). (add a short note about what you learned each time).', 1, 2),
  ('a10413bb-d7f7-5341-8876-f3a4ea83949c'::uuid, 'Choose 4 people (family, friends, classmates) and learn one real need each (4).', 4, 0),
  ('a10413bb-d7f7-5341-8876-f3a4ea83949c'::uuid, 'Do 8 meaningful contacts (2 per person) (8).', 2, 1),
  ('a10413bb-d7f7-5341-8876-f3a4ea83949c'::uuid, 'Do 4 acts of help (1 per person) and record the result (4).', 1, 2),
  ('4afe381d-726c-595d-8483-29bab69f0bc1'::uuid, 'Say ''thank you'' sincerely 12 times (track 12).', 12, 0),
  ('4afe381d-726c-595d-8483-29bab69f0bc1'::uuid, 'Say ''I am sorry'' and repair 3 small wrongs (3).', 3, 1),
  ('4afe381d-726c-595d-8483-29bab69f0bc1'::uuid, 'Say ''I love you'' or give heartfelt appreciation 10 times (10).', 10, 2),
  ('4afe381d-726c-595d-8483-29bab69f0bc1'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('b0ad556b-9a3c-553a-a83a-ac2af63df548'::uuid, 'Identify 3 common social triggers (teasing, gossip, anger) and write a ''celestial response'' for each.', 3, 0),
  ('b0ad556b-9a3c-553a-a83a-ac2af63df548'::uuid, 'Use a ''celestial response'' in 10 moments (track date + what you did).', 10, 1),
  ('b0ad556b-9a3c-553a-a83a-ac2af63df548'::uuid, 'Send 6 uplifting messages or compliments that build others instead of comparing or tearing down (6).', 6, 2),
  ('e0f49a44-7407-57e3-92c0-54bf6f7f85e0'::uuid, 'Memorize 3 peacemaker phrases (e.g., "Help me understand," "I''m sorry," "Let''s fix this") and use them 10 times (track).', 3, 0),
  ('e0f49a44-7407-57e3-92c0-54bf6f7f85e0'::uuid, 'Avoid gossip for 14 days by using a ''redirect'' strategy when negativity starts (track 14).', 14, 1),
  ('e0f49a44-7407-57e3-92c0-54bf6f7f85e0'::uuid, 'Do 4 bridge-building acts: include someone, encourage someone, reconcile, or defend someone kindly (4).', 4, 2),
  ('97a4f4c2-c838-5b7d-a833-a2fe969ab418'::uuid, 'Do 10 small kindness actions (help, include, encourage) and list them (10).', 10, 0),
  ('97a4f4c2-c838-5b7d-a833-a2fe969ab418'::uuid, 'End conflict: choose one conflict pattern to stop (sarcasm, snapping) and track 12 successful stops (12).', 12, 1),
  ('97a4f4c2-c838-5b7d-a833-a2fe969ab418'::uuid, 'Serve in a way that strengthens your group (family, quorum/class, team) 4 times (4). (add a short note about what you learned each time).', 4, 2),
  ('3f2d849b-ce55-5afd-be5d-22e8b8eeb7d1'::uuid, 'Identify 2 people who seem stressed and list 2 ways to help each (plan).', 2, 0),
  ('3f2d849b-ce55-5afd-be5d-22e8b8eeb7d1'::uuid, 'Complete 8 burden-lifting actions (listen, help, include, encourage) and record (8).', 8, 1),
  ('3f2d849b-ce55-5afd-be5d-22e8b8eeb7d1'::uuid, 'Reduce ''pressure language'': replace 10 negative comments with supportive words (track 10).', 10, 2),
  ('88832e49-91f4-5a74-a6cc-02e0f7448b89'::uuid, 'Set one boundary that keeps you faithful (language, media, group chats) and keep it for 30 days (track).', 30, 0),
  ('88832e49-91f4-5a74-a6cc-02e0f7448b89'::uuid, 'Do 8 ''light'' actions: defend someone, include someone, encourage someone, refuse gossip (8).', 8, 1),
  ('88832e49-91f4-5a74-a6cc-02e0f7448b89'::uuid, 'Invite one person toward good: church activity, family night, uplifting talk, or prayer (1 invite + follow-up).', 1, 2),
  ('88832e49-91f4-5a74-a6cc-02e0f7448b89'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('9c0d863c-eb1c-50d0-9a73-31059819ffb4'::uuid, 'Do 6 ''trust deposits'': keep promises, be on time, do chores without reminders (6).', 6, 0),
  ('9c0d863c-eb1c-50d0-9a73-31059819ffb4'::uuid, 'Say 6 ''root words'': thank you, I''m sorry, I love you, or sincere praise (6).', 6, 1),
  ('9c0d863c-eb1c-50d0-9a73-31059819ffb4'::uuid, 'Have 2 honest conversations to strengthen understanding (2).', 2, 2),
  ('092577ed-bd90-5de6-aad7-df9717113a98'::uuid, 'Do 6 courageous kindness acts (stand up for someone, include someone, tell truth kindly) (6).', 6, 0),
  ('092577ed-bd90-5de6-aad7-df9717113a98'::uuid, 'Invite one person into your circle 4 times (4).', 4, 1),
  ('092577ed-bd90-5de6-aad7-df9717113a98'::uuid, 'Write 2 reflections: how did faith change your courage? (2).', 2, 2),
  ('8536c76c-966a-5988-a77c-6665d022763a'::uuid, 'Make 12 small promises you can keep (chores, messages, being on time) and track each kept promise (12).', 12, 0),
  ('8536c76c-966a-5988-a77c-6665d022763a'::uuid, 'Repair one trust break: apologize + make a plan to change (1).', 1, 1),
  ('8536c76c-966a-5988-a77c-6665d022763a'::uuid, 'Ask one person: ''How can I be more trustworthy?'' and act on one suggestion (1). (add a short note about what you learned each time).', 1, 2),
  ('b95297f5-c92a-5bb5-9a40-0576dfdc1bc6'::uuid, 'Choose 4 people (family, friends, classmates) and learn one real need each (4).', 4, 0),
  ('b95297f5-c92a-5bb5-9a40-0576dfdc1bc6'::uuid, 'Do 8 meaningful contacts (2 per person) (8).', 2, 1),
  ('b95297f5-c92a-5bb5-9a40-0576dfdc1bc6'::uuid, 'Do 4 acts of help (1 per person) and record the result (4).', 1, 2),
  ('d822d828-6ae2-528d-8861-3f8125bc213b'::uuid, 'Say ''thank you'' sincerely 12 times (track 12).', 12, 0),
  ('d822d828-6ae2-528d-8861-3f8125bc213b'::uuid, 'Say ''I am sorry'' and repair 3 small wrongs (3).', 3, 1),
  ('d822d828-6ae2-528d-8861-3f8125bc213b'::uuid, 'Say ''I love you'' or give heartfelt appreciation 10 times (10).', 10, 2),
  ('d822d828-6ae2-528d-8861-3f8125bc213b'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('e18d6226-ce69-5ce4-b27b-c68ec3c470c6'::uuid, 'Identify 3 common social triggers (teasing, gossip, anger) and write a ''celestial response'' for each.', 3, 0),
  ('e18d6226-ce69-5ce4-b27b-c68ec3c470c6'::uuid, 'Use a ''celestial response'' in 10 moments (track date + what you did).', 10, 1),
  ('e18d6226-ce69-5ce4-b27b-c68ec3c470c6'::uuid, 'Send 6 uplifting messages or compliments that build others instead of comparing or tearing down (6).', 6, 2),
  ('17df0be5-3549-502d-a436-5c1338db80df'::uuid, 'Memorize 3 peacemaker phrases (e.g., "Help me understand," "I''m sorry," "Let''s fix this") and use them 10 times (track).', 3, 0),
  ('17df0be5-3549-502d-a436-5c1338db80df'::uuid, 'Avoid gossip for 14 days by using a ''redirect'' strategy when negativity starts (track 14).', 14, 1),
  ('17df0be5-3549-502d-a436-5c1338db80df'::uuid, 'Do 4 bridge-building acts: include someone, encourage someone, reconcile, or defend someone kindly (4).', 4, 2),
  ('a7eb1443-5946-5513-9601-d80f37f72a6c'::uuid, 'Do 10 small kindness actions (help, include, encourage) and list them (10).', 10, 0),
  ('a7eb1443-5946-5513-9601-d80f37f72a6c'::uuid, 'End conflict: choose one conflict pattern to stop (sarcasm, snapping) and track 12 successful stops (12).', 12, 1),
  ('a7eb1443-5946-5513-9601-d80f37f72a6c'::uuid, 'Serve in a way that strengthens your group (family, quorum/class, team) 4 times (4). (add a short note about what you learned each time).', 4, 2),
  ('dad5d4f5-add5-5edd-a095-f7fa9f900d65'::uuid, 'Identify 2 people who seem stressed and list 2 ways to help each (plan).', 2, 0),
  ('dad5d4f5-add5-5edd-a095-f7fa9f900d65'::uuid, 'Complete 8 burden-lifting actions (listen, help, include, encourage) and record (8).', 8, 1),
  ('dad5d4f5-add5-5edd-a095-f7fa9f900d65'::uuid, 'Reduce ''pressure language'': replace 10 negative comments with supportive words (track 10).', 10, 2),
  ('33f561d3-b8c7-53db-84cc-7f6f937e5c93'::uuid, 'Set one boundary that keeps you faithful (language, media, group chats) and keep it for 30 days (track).', 30, 0),
  ('33f561d3-b8c7-53db-84cc-7f6f937e5c93'::uuid, 'Do 8 ''light'' actions: defend someone, include someone, encourage someone, refuse gossip (8).', 8, 1),
  ('33f561d3-b8c7-53db-84cc-7f6f937e5c93'::uuid, 'Invite one person toward good: church activity, family night, uplifting talk, or prayer (1 invite + follow-up).', 1, 2),
  ('33f561d3-b8c7-53db-84cc-7f6f937e5c93'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('96a90848-96db-5615-81a2-3cfda9467160'::uuid, 'Do 6 ''trust deposits'': keep promises, be on time, do chores without reminders (6).', 6, 0),
  ('96a90848-96db-5615-81a2-3cfda9467160'::uuid, 'Say 6 ''root words'': thank you, I''m sorry, I love you, or sincere praise (6).', 6, 1),
  ('96a90848-96db-5615-81a2-3cfda9467160'::uuid, 'Have 2 honest conversations to strengthen understanding (2).', 2, 2),
  ('62a524c4-5810-5bda-b628-e744aae143a1'::uuid, 'Do 6 courageous kindness acts (stand up for someone, include someone, tell truth kindly) (6).', 6, 0),
  ('62a524c4-5810-5bda-b628-e744aae143a1'::uuid, 'Invite one person into your circle 4 times (4).', 4, 1),
  ('62a524c4-5810-5bda-b628-e744aae143a1'::uuid, 'Write 2 reflections: how did faith change your courage? (2).', 2, 2),
  ('6a30cc16-5fe9-5816-b45c-a8960a34525d'::uuid, 'Make 12 small promises you can keep (chores, messages, being on time) and track each kept promise (12).', 12, 0),
  ('6a30cc16-5fe9-5816-b45c-a8960a34525d'::uuid, 'Repair one trust break: apologize + make a plan to change (1).', 1, 1),
  ('6a30cc16-5fe9-5816-b45c-a8960a34525d'::uuid, 'Ask one person: ''How can I be more trustworthy?'' and act on one suggestion (1). (add a short note about what you learned each time).', 1, 2),
  ('1f1d710c-703a-5a91-a1b9-a09a2933d95a'::uuid, 'Choose 4 people (family, friends, classmates) and learn one real need each (4).', 4, 0),
  ('1f1d710c-703a-5a91-a1b9-a09a2933d95a'::uuid, 'Do 8 meaningful contacts (2 per person) (8).', 2, 1),
  ('1f1d710c-703a-5a91-a1b9-a09a2933d95a'::uuid, 'Do 4 acts of help (1 per person) and record the result (4).', 1, 2),
  ('9b8cccd4-80b5-5c4c-b510-2a69fa52944f'::uuid, 'Say ''thank you'' sincerely 12 times (track 12).', 12, 0),
  ('9b8cccd4-80b5-5c4c-b510-2a69fa52944f'::uuid, 'Say ''I am sorry'' and repair 3 small wrongs (3).', 3, 1),
  ('9b8cccd4-80b5-5c4c-b510-2a69fa52944f'::uuid, 'Say ''I love you'' or give heartfelt appreciation 10 times (10).', 10, 2),
  ('9b8cccd4-80b5-5c4c-b510-2a69fa52944f'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('ea71adc0-5b70-5faa-9743-9cd33dc7b046'::uuid, 'Identify 3 common social triggers (teasing, gossip, anger) and write a ''celestial response'' for each.', 3, 0),
  ('ea71adc0-5b70-5faa-9743-9cd33dc7b046'::uuid, 'Use a ''celestial response'' in 10 moments (track date + what you did).', 10, 1),
  ('ea71adc0-5b70-5faa-9743-9cd33dc7b046'::uuid, 'Send 6 uplifting messages or compliments that build others instead of comparing or tearing down (6).', 6, 2),
  ('3ce89d25-0435-5ee5-adf0-5b8fdcef5182'::uuid, 'Learn 3 skills: active listening, ''I'' statements, and finding common ground (write 1 line on each).', 1, 0),
  ('3ce89d25-0435-5ee5-adf0-5b8fdcef5182'::uuid, 'Practice active listening in 6 conversations: summarize what the other person said before responding (track 6).', 6, 1),
  ('3ce89d25-0435-5ee5-adf0-5b8fdcef5182'::uuid, 'Write a 1-page ''my peacemaking plan'' with triggers, strategies, and examples (1 page).', 1, 2),
  ('a6046c90-c4c2-597f-bc0a-a627e41c92a4'::uuid, 'Study 20 days for at least 20 minutes (track 20).', 20, 0),
  ('a6046c90-c4c2-597f-bc0a-a627e41c92a4'::uuid, 'Use a ''learn about God + learn about life'' method: 10 days scripture/talk study + 10 days school skill practice (20 total).', 20, 1),
  ('a6046c90-c4c2-597f-bc0a-a627e41c92a4'::uuid, 'Weekly review: list 3 things learned and 1 next step (4 reviews). (add a short note about what you learned each time).', 4, 2),
  ('90cba8bd-f307-5577-84a0-b96e13bb802a'::uuid, 'Make a weekly schedule 4 times (4 weekly plans).', 4, 0),
  ('90cba8bd-f307-5577-84a0-b96e13bb802a'::uuid, 'Complete 12 focused sessions (25 minutes + 5 break) and track completion (12).', 12, 1),
  ('90cba8bd-f307-5577-84a0-b96e13bb802a'::uuid, 'Write 4 ''what helped me feel rest'' reflections after finishing hard work (4).', 4, 2),
  ('01c0328f-72e3-525b-b799-92da7c2a80f2'::uuid, 'Write a 1-page values-based goal sheet: faith, school, family, service, health.', 1, 0),
  ('01c0328f-72e3-525b-b799-92da7c2a80f2'::uuid, 'Complete 12 sessions of skill-building (study, writing, math, music) and track (12).', 12, 1),
  ('01c0328f-72e3-525b-b799-92da7c2a80f2'::uuid, 'Do 4 weekly reviews: what influence was strongest this week, and how did you respond? (4).', 4, 2),
  ('01c0328f-72e3-525b-b799-92da7c2a80f2'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('2b48cd98-ee24-5d5b-af82-0cc45e1d49b1'::uuid, 'Pick one subject and list 5 fundamentals you need (1 list).', 1, 0),
  ('2b48cd98-ee24-5d5b-af82-0cc45e1d49b1'::uuid, 'Practice fundamentals 12 sessions (track 12).', 12, 1),
  ('2b48cd98-ee24-5d5b-af82-0cc45e1d49b1'::uuid, 'Do 4 check-ins: test yourself and adjust what you practice (4).', 4, 2),
  ('cb81e863-95b3-5650-b4f7-4e72d5c04318'::uuid, 'Choose one target (raise a quiz score, finish missing work, improve writing) and set a number goal.', 1, 0),
  ('cb81e863-95b3-5650-b4f7-4e72d5c04318'::uuid, 'Complete 12 focused study sessions (12).', 12, 1),
  ('cb81e863-95b3-5650-b4f7-4e72d5c04318'::uuid, 'Track one measurable result (score, assignments, reading pages) weekly (4).', 4, 2),
  ('cabb9966-ab0d-5aaf-9201-fb491812a64b'::uuid, 'Study/work 20 days for 20 minutes (20).', 20, 0),
  ('cabb9966-ab0d-5aaf-9201-fb491812a64b'::uuid, 'Keep a ''done list'' daily (15 days) to prove progress (15).', 15, 1),
  ('cabb9966-ab0d-5aaf-9201-fb491812a64b'::uuid, 'Weekly review: identify one pattern that builds trust in yourself (4). (add a short note about what you learned each time).', 4, 2),
  ('e0d02ed1-c29c-5b61-9383-5499ee03bb3c'::uuid, 'Keep a ''notice journal'' 10 days: write one need you noticed and one action you could take (10).', 10, 0),
  ('e0d02ed1-c29c-5b61-9383-5499ee03bb3c'::uuid, 'Choose 4 needs and follow through with real help (4).', 4, 1),
  ('e0d02ed1-c29c-5b61-9383-5499ee03bb3c'::uuid, 'Reflect: what patterns help you notice people better? (2 reflections).', 2, 2),
  ('9573011a-c930-5d21-a92b-6bd6a30703aa'::uuid, 'Rewrite 10 texts/comments to be clearer and kinder before sending (track 10).', 10, 0),
  ('9573011a-c930-5d21-a92b-6bd6a30703aa'::uuid, 'Learn 5 new ''kind clarity'' phrases (e.g., ''Here''s what I meant...'') and use 5 of them (5).', 5, 1),
  ('9573011a-c930-5d21-a92b-6bd6a30703aa'::uuid, 'Reflect 2 times on how words changed outcomes (2).', 2, 2),
  ('9573011a-c930-5d21-a92b-6bd6a30703aa'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('21404e02-490c-5859-9121-d5a67effb31a'::uuid, 'Write a 1-page plan: values, goals, education/career interests, and how faith fits into all of it.', 1, 0),
  ('21404e02-490c-5859-9121-d5a67effb31a'::uuid, 'Choose 2 skills that will help your future (study habits, budgeting, writing) and practice each 6 times (12 total).', 12, 1),
  ('21404e02-490c-5859-9121-d5a67effb31a'::uuid, 'Review the plan weekly and update one line each week (4 updates).', 4, 2),
  ('7ad196cf-3bca-5803-b790-bdccb301300d'::uuid, 'Learn 3 skills: active listening, ''I'' statements, and finding common ground (write 1 line on each).', 1, 0),
  ('7ad196cf-3bca-5803-b790-bdccb301300d'::uuid, 'Practice active listening in 6 conversations: summarize what the other person said before responding (track 6).', 6, 1),
  ('7ad196cf-3bca-5803-b790-bdccb301300d'::uuid, 'Write a 1-page ''my peacemaking plan'' with triggers, strategies, and examples (1 page).', 1, 2),
  ('e8b4bff2-bab1-5b78-87be-4843a1704f74'::uuid, 'Study 20 days for at least 20 minutes (track 20).', 20, 0),
  ('e8b4bff2-bab1-5b78-87be-4843a1704f74'::uuid, 'Use a ''learn about God + learn about life'' method: 10 days scripture/talk study + 10 days school skill practice (20 total).', 20, 1),
  ('e8b4bff2-bab1-5b78-87be-4843a1704f74'::uuid, 'Weekly review: list 3 things learned and 1 next step (4 reviews). (add a short note about what you learned each time).', 4, 2),
  ('54315918-62fa-57b5-a604-16163b2a6c89'::uuid, 'Make a weekly schedule 4 times (4 weekly plans).', 4, 0),
  ('54315918-62fa-57b5-a604-16163b2a6c89'::uuid, 'Complete 12 focused sessions (25 minutes + 5 break) and track completion (12).', 12, 1),
  ('54315918-62fa-57b5-a604-16163b2a6c89'::uuid, 'Write 4 ''what helped me feel rest'' reflections after finishing hard work (4).', 4, 2),
  ('47ccaa7f-3c9e-5f92-9187-532ec82fe478'::uuid, 'Write a 1-page values-based goal sheet: faith, school, family, service, health.', 1, 0),
  ('47ccaa7f-3c9e-5f92-9187-532ec82fe478'::uuid, 'Complete 12 sessions of skill-building (study, writing, math, music) and track (12).', 12, 1),
  ('47ccaa7f-3c9e-5f92-9187-532ec82fe478'::uuid, 'Do 4 weekly reviews: what influence was strongest this week, and how did you respond? (4).', 4, 2),
  ('47ccaa7f-3c9e-5f92-9187-532ec82fe478'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('ab87c157-93db-54c9-b36d-a932b752a015'::uuid, 'Pick one subject and list 5 fundamentals you need (1 list).', 1, 0),
  ('ab87c157-93db-54c9-b36d-a932b752a015'::uuid, 'Practice fundamentals 12 sessions (track 12).', 12, 1),
  ('ab87c157-93db-54c9-b36d-a932b752a015'::uuid, 'Do 4 check-ins: test yourself and adjust what you practice (4).', 4, 2),
  ('fb582e51-20e0-5837-9350-adb1538f3605'::uuid, 'Choose one target (raise a quiz score, finish missing work, improve writing) and set a number goal.', 1, 0),
  ('fb582e51-20e0-5837-9350-adb1538f3605'::uuid, 'Complete 12 focused study sessions (12).', 12, 1),
  ('fb582e51-20e0-5837-9350-adb1538f3605'::uuid, 'Track one measurable result (score, assignments, reading pages) weekly (4).', 4, 2),
  ('e3ebee23-823e-5512-80ba-35986f1048d3'::uuid, 'Study/work 20 days for 20 minutes (20).', 20, 0),
  ('e3ebee23-823e-5512-80ba-35986f1048d3'::uuid, 'Keep a ''done list'' daily (15 days) to prove progress (15).', 15, 1),
  ('e3ebee23-823e-5512-80ba-35986f1048d3'::uuid, 'Weekly review: identify one pattern that builds trust in yourself (4). (add a short note about what you learned each time).', 4, 2),
  ('e8201e88-5efc-5af8-bdb3-5a8427d0b556'::uuid, 'Keep a ''notice journal'' 10 days: write one need you noticed and one action you could take (10).', 10, 0),
  ('e8201e88-5efc-5af8-bdb3-5a8427d0b556'::uuid, 'Choose 4 needs and follow through with real help (4).', 4, 1),
  ('e8201e88-5efc-5af8-bdb3-5a8427d0b556'::uuid, 'Reflect: what patterns help you notice people better? (2 reflections).', 2, 2),
  ('ce8928e9-deb4-5fd8-8eb5-e899653b8381'::uuid, 'Rewrite 10 texts/comments to be clearer and kinder before sending (track 10).', 10, 0),
  ('ce8928e9-deb4-5fd8-8eb5-e899653b8381'::uuid, 'Learn 5 new ''kind clarity'' phrases (e.g., ''Here''s what I meant...'') and use 5 of them (5).', 5, 1),
  ('ce8928e9-deb4-5fd8-8eb5-e899653b8381'::uuid, 'Reflect 2 times on how words changed outcomes (2).', 2, 2),
  ('ce8928e9-deb4-5fd8-8eb5-e899653b8381'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('fac8ae4b-b06d-5cb2-bbb1-6e3d3d3184a6'::uuid, 'Write a 1-page plan: values, goals, education/career interests, and how faith fits into all of it.', 1, 0),
  ('fac8ae4b-b06d-5cb2-bbb1-6e3d3d3184a6'::uuid, 'Choose 2 skills that will help your future (study habits, budgeting, writing) and practice each 6 times (12 total).', 12, 1),
  ('fac8ae4b-b06d-5cb2-bbb1-6e3d3d3184a6'::uuid, 'Review the plan weekly and update one line each week (4 updates).', 4, 2),
  ('034cde29-3dc4-5027-836b-42e9375600ce'::uuid, 'Learn 3 skills: active listening, ''I'' statements, and finding common ground (write 1 line on each).', 1, 0),
  ('034cde29-3dc4-5027-836b-42e9375600ce'::uuid, 'Practice active listening in 6 conversations: summarize what the other person said before responding (track 6).', 6, 1),
  ('034cde29-3dc4-5027-836b-42e9375600ce'::uuid, 'Write a 1-page ''my peacemaking plan'' with triggers, strategies, and examples (1 page).', 1, 2),
  ('1f50c7f8-5bf8-5215-aef4-d3cee14cf7cc'::uuid, 'Study 20 days for at least 20 minutes (track 20).', 20, 0),
  ('1f50c7f8-5bf8-5215-aef4-d3cee14cf7cc'::uuid, 'Use a ''learn about God + learn about life'' method: 10 days scripture/talk study + 10 days school skill practice (20 total).', 20, 1),
  ('1f50c7f8-5bf8-5215-aef4-d3cee14cf7cc'::uuid, 'Weekly review: list 3 things learned and 1 next step (4 reviews). (add a short note about what you learned each time).', 4, 2),
  ('d6e3d71f-1a85-5677-aa86-128e0ba11e4f'::uuid, 'Make a weekly schedule 4 times (4 weekly plans).', 4, 0),
  ('d6e3d71f-1a85-5677-aa86-128e0ba11e4f'::uuid, 'Complete 12 focused sessions (25 minutes + 5 break) and track completion (12).', 12, 1),
  ('d6e3d71f-1a85-5677-aa86-128e0ba11e4f'::uuid, 'Write 4 ''what helped me feel rest'' reflections after finishing hard work (4).', 4, 2),
  ('e8b3b5ac-0f12-5834-89a5-260fedb7447b'::uuid, 'Write a 1-page values-based goal sheet: faith, school, family, service, health.', 1, 0),
  ('e8b3b5ac-0f12-5834-89a5-260fedb7447b'::uuid, 'Complete 12 sessions of skill-building (study, writing, math, music) and track (12).', 12, 1),
  ('e8b3b5ac-0f12-5834-89a5-260fedb7447b'::uuid, 'Do 4 weekly reviews: what influence was strongest this week, and how did you respond? (4).', 4, 2),
  ('e8b3b5ac-0f12-5834-89a5-260fedb7447b'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('d7208591-0698-50b0-b6d2-e053023d2acd'::uuid, 'Pick one subject and list 5 fundamentals you need (1 list).', 1, 0),
  ('d7208591-0698-50b0-b6d2-e053023d2acd'::uuid, 'Practice fundamentals 12 sessions (track 12).', 12, 1),
  ('d7208591-0698-50b0-b6d2-e053023d2acd'::uuid, 'Do 4 check-ins: test yourself and adjust what you practice (4).', 4, 2),
  ('f35d6ae4-e29c-57c2-bfff-1453c0ea598d'::uuid, 'Choose one target (raise a quiz score, finish missing work, improve writing) and set a number goal.', 1, 0),
  ('f35d6ae4-e29c-57c2-bfff-1453c0ea598d'::uuid, 'Complete 12 focused study sessions (12).', 12, 1),
  ('f35d6ae4-e29c-57c2-bfff-1453c0ea598d'::uuid, 'Track one measurable result (score, assignments, reading pages) weekly (4).', 4, 2),
  ('bec32dbd-4108-522e-88b7-066bcaf653c5'::uuid, 'Study/work 20 days for 20 minutes (20).', 20, 0),
  ('bec32dbd-4108-522e-88b7-066bcaf653c5'::uuid, 'Keep a ''done list'' daily (15 days) to prove progress (15).', 15, 1),
  ('bec32dbd-4108-522e-88b7-066bcaf653c5'::uuid, 'Weekly review: identify one pattern that builds trust in yourself (4). (add a short note about what you learned each time).', 4, 2),
  ('8faeabc5-3f41-5102-b59c-e5c67905c9d3'::uuid, 'Keep a ''notice journal'' 10 days: write one need you noticed and one action you could take (10).', 10, 0),
  ('8faeabc5-3f41-5102-b59c-e5c67905c9d3'::uuid, 'Choose 4 needs and follow through with real help (4).', 4, 1),
  ('8faeabc5-3f41-5102-b59c-e5c67905c9d3'::uuid, 'Reflect: what patterns help you notice people better? (2 reflections).', 2, 2),
  ('1132d1fe-5ed4-5f7a-b4fd-c4563ba6c1f4'::uuid, 'Rewrite 10 texts/comments to be clearer and kinder before sending (track 10).', 10, 0),
  ('1132d1fe-5ed4-5f7a-b4fd-c4563ba6c1f4'::uuid, 'Learn 5 new ''kind clarity'' phrases (e.g., ''Here''s what I meant...'') and use 5 of them (5).', 5, 1),
  ('1132d1fe-5ed4-5f7a-b4fd-c4563ba6c1f4'::uuid, 'Reflect 2 times on how words changed outcomes (2).', 2, 2),
  ('1132d1fe-5ed4-5f7a-b4fd-c4563ba6c1f4'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('ed37535d-5817-5a3d-9cc0-f0d6af14022c'::uuid, 'Write a 1-page plan: values, goals, education/career interests, and how faith fits into all of it.', 1, 0),
  ('ed37535d-5817-5a3d-9cc0-f0d6af14022c'::uuid, 'Choose 2 skills that will help your future (study habits, budgeting, writing) and practice each 6 times (12 total).', 12, 1),
  ('ed37535d-5817-5a3d-9cc0-f0d6af14022c'::uuid, 'Review the plan weekly and update one line each week (4 updates).', 4, 2),
  ('8c057693-6fa4-5111-801f-41c5882d9ef3'::uuid, 'Practice a 2-minute breathing pattern (box breathing) 12 times when upset (track 12).', 12, 0),
  ('8c057693-6fa4-5111-801f-41c5882d9ef3'::uuid, 'Take 8 short ''cool-down'' walks (5-15 minutes) after stressful moments (8).', 8, 1),
  ('8c057693-6fa4-5111-801f-41c5882d9ef3'::uuid, 'Improve sleep on 8 nights by turning screens off 30 minutes earlier to reduce irritability (8).', 8, 2),
  ('c374cbb4-e635-5851-886c-cbd27afd7782'::uuid, 'Move your body 20 days (walk, sport, workout) for 20+ minutes (track 20).', 20, 0),
  ('c374cbb4-e635-5851-886c-cbd27afd7782'::uuid, 'Choose 10 recovery actions (stretching, hydration, sleep) and track them (10).', 10, 1),
  ('c374cbb4-e635-5851-886c-cbd27afd7782'::uuid, 'End conflict with your body: replace one unhealthy habit (late-night scrolling, soda) 10 times (10). (add a short note about what you learned each time).', 10, 2),
  ('a175a369-c143-571c-88a5-d4769edb32dc'::uuid, 'Get a consistent bedtime on 10 nights (track 10).', 10, 0),
  ('a175a369-c143-571c-88a5-d4769edb32dc'::uuid, 'Do a 10-minute wind-down routine 14 times (stretch, pray, journal) (14).', 14, 1),
  ('a175a369-c143-571c-88a5-d4769edb32dc'::uuid, 'Take 6 recovery walks or gentle workouts (6).', 6, 2),
  ('38e8918d-54cf-5eb5-9de5-d55a1423ab7a'::uuid, 'Move 12 times (20-30 minutes) (12).', 12, 0),
  ('38e8918d-54cf-5eb5-9de5-d55a1423ab7a'::uuid, 'Choose 8 ''self-control'' wins (sleep, food, screen limits) and track (8).', 8, 1),
  ('38e8918d-54cf-5eb5-9de5-d55a1423ab7a'::uuid, 'Write 4 reflections: how did discipline change confidence and mood? (4).', 4, 2),
  ('38e8918d-54cf-5eb5-9de5-d55a1423ab7a'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('288577e2-23ac-5002-b8ed-d42334d5e0b2'::uuid, 'Sleep: hit your target bedtime 8 nights (8).', 8, 0),
  ('288577e2-23ac-5002-b8ed-d42334d5e0b2'::uuid, 'Movement: do 12 sessions (12).', 12, 1),
  ('288577e2-23ac-5002-b8ed-d42334d5e0b2'::uuid, 'Fuel: make 10 balanced snack/meal choices and record (10).', 10, 2),
  ('4e8df75e-0da4-572f-89df-3581bfe39587'::uuid, 'Pick one metric (push-ups, mile time, plank) and record baseline (1).', 1, 0),
  ('4e8df75e-0da4-572f-89df-3581bfe39587'::uuid, 'Train 12 sessions (12).', 12, 1),
  ('4e8df75e-0da4-572f-89df-3581bfe39587'::uuid, 'Re-test at day 30 and record improvement (1).', 1, 2),
  ('4ad451cb-faab-5d35-93d6-3522df15cfd9'::uuid, 'Complete 12 movement sessions (12).', 12, 0),
  ('4ad451cb-faab-5d35-93d6-3522df15cfd9'::uuid, 'Sleep goal on 8 nights (8).', 8, 1),
  ('4ad451cb-faab-5d35-93d6-3522df15cfd9'::uuid, 'Track 20 days of at least one healthy choice (20). (add a short note about what you learned each time).', 20, 2),
  ('604fd5c7-2a09-52a4-9816-8a3647b801f3'::uuid, 'Choose 6 tasks that require effort (yardwork, cleanup, moving, shoveling, babysitting) (6 planned).', 6, 0),
  ('604fd5c7-2a09-52a4-9816-8a3647b801f3'::uuid, 'Complete the 6 tasks and record date/time (6).', 6, 1),
  ('604fd5c7-2a09-52a4-9816-8a3647b801f3'::uuid, 'Stretch/hydrate after 6 tasks to care for your body too (6).', 6, 2),
  ('c694e475-623c-56fa-a29f-4290e6df3db2'::uuid, 'Write 5 ''replacement phrases'' (e.g., ''I''m learning,'' ''I can try again'') (5).', 5, 0),
  ('c694e475-623c-56fa-a29f-4290e6df3db2'::uuid, 'Use replacements 20 times when you catch negative self-talk (track 20).', 20, 1),
  ('c694e475-623c-56fa-a29f-4290e6df3db2'::uuid, 'Do 6 calming resets after harsh moments: breathe + kind self-talk (6).', 6, 2),
  ('c694e475-623c-56fa-a29f-4290e6df3db2'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('06c41cd9-763f-50c1-b07a-0552d21d90d0'::uuid, 'Complete 12 movement sessions (20-30 minutes each) and record what you did (12).', 12, 0),
  ('06c41cd9-763f-50c1-b07a-0552d21d90d0'::uuid, 'Make 8 ''better fuel'' choices (water over soda, fruit/veg, protein) and track each choice (8).', 8, 1),
  ('06c41cd9-763f-50c1-b07a-0552d21d90d0'::uuid, 'Do a weekly reset: set bedtime, plan snacks, and choose your exercise days (4 weekly plans).', 4, 2),
  ('b5d8aff3-8f33-59f7-9aa4-caa701b29abf'::uuid, 'Practice a 2-minute breathing pattern (box breathing) 12 times when upset (track 12).', 12, 0),
  ('b5d8aff3-8f33-59f7-9aa4-caa701b29abf'::uuid, 'Take 8 short ''cool-down'' walks (5-15 minutes) after stressful moments (8).', 8, 1),
  ('b5d8aff3-8f33-59f7-9aa4-caa701b29abf'::uuid, 'Improve sleep on 8 nights by turning screens off 30 minutes earlier to reduce irritability (8).', 8, 2),
  ('3d1634c3-a216-5587-a56d-6f3def25ec3e'::uuid, 'Move your body 20 days (walk, sport, workout) for 20+ minutes (track 20).', 20, 0),
  ('3d1634c3-a216-5587-a56d-6f3def25ec3e'::uuid, 'Choose 10 recovery actions (stretching, hydration, sleep) and track them (10).', 10, 1),
  ('3d1634c3-a216-5587-a56d-6f3def25ec3e'::uuid, 'End conflict with your body: replace one unhealthy habit (late-night scrolling, soda) 10 times (10). (add a short note about what you learned each time).', 10, 2),
  ('235aadf9-7be9-517a-99e2-6fa720aee755'::uuid, 'Get a consistent bedtime on 10 nights (track 10).', 10, 0),
  ('235aadf9-7be9-517a-99e2-6fa720aee755'::uuid, 'Do a 10-minute wind-down routine 14 times (stretch, pray, journal) (14).', 14, 1),
  ('235aadf9-7be9-517a-99e2-6fa720aee755'::uuid, 'Take 6 recovery walks or gentle workouts (6).', 6, 2),
  ('6bbf9b43-6642-5c5b-b5b1-545f550895c4'::uuid, 'Move 12 times (20-30 minutes) (12).', 12, 0),
  ('6bbf9b43-6642-5c5b-b5b1-545f550895c4'::uuid, 'Choose 8 ''self-control'' wins (sleep, food, screen limits) and track (8).', 8, 1),
  ('6bbf9b43-6642-5c5b-b5b1-545f550895c4'::uuid, 'Write 4 reflections: how did discipline change confidence and mood? (4).', 4, 2),
  ('6bbf9b43-6642-5c5b-b5b1-545f550895c4'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('7f3dd014-4f20-51a4-b30f-9558daf3e1af'::uuid, 'Sleep: hit your target bedtime 8 nights (8).', 8, 0),
  ('7f3dd014-4f20-51a4-b30f-9558daf3e1af'::uuid, 'Movement: do 12 sessions (12).', 12, 1),
  ('7f3dd014-4f20-51a4-b30f-9558daf3e1af'::uuid, 'Fuel: make 10 balanced snack/meal choices and record (10).', 10, 2),
  ('b50b4c45-2b2a-585e-b2bf-31efa51c9b61'::uuid, 'Pick one metric (push-ups, mile time, plank) and record baseline (1).', 1, 0),
  ('b50b4c45-2b2a-585e-b2bf-31efa51c9b61'::uuid, 'Train 12 sessions (12).', 12, 1),
  ('b50b4c45-2b2a-585e-b2bf-31efa51c9b61'::uuid, 'Re-test at day 30 and record improvement (1).', 1, 2),
  ('13a385e9-d576-5682-b837-2768600e04dc'::uuid, 'Complete 12 movement sessions (12).', 12, 0),
  ('13a385e9-d576-5682-b837-2768600e04dc'::uuid, 'Sleep goal on 8 nights (8).', 8, 1),
  ('13a385e9-d576-5682-b837-2768600e04dc'::uuid, 'Track 20 days of at least one healthy choice (20). (add a short note about what you learned each time).', 20, 2),
  ('f8d7e2a3-2175-5fec-b47a-fd898f0cdd58'::uuid, 'Choose 6 tasks that require effort (yardwork, cleanup, moving, shoveling, babysitting) (6 planned).', 6, 0),
  ('f8d7e2a3-2175-5fec-b47a-fd898f0cdd58'::uuid, 'Complete the 6 tasks and record date/time (6).', 6, 1),
  ('f8d7e2a3-2175-5fec-b47a-fd898f0cdd58'::uuid, 'Stretch/hydrate after 6 tasks to care for your body too (6).', 6, 2),
  ('422a2ea3-910a-50a0-96d7-7ba3adfda69e'::uuid, 'Write 5 ''replacement phrases'' (e.g., ''I''m learning,'' ''I can try again'') (5).', 5, 0),
  ('422a2ea3-910a-50a0-96d7-7ba3adfda69e'::uuid, 'Use replacements 20 times when you catch negative self-talk (track 20).', 20, 1),
  ('422a2ea3-910a-50a0-96d7-7ba3adfda69e'::uuid, 'Do 6 calming resets after harsh moments: breathe + kind self-talk (6).', 6, 2),
  ('422a2ea3-910a-50a0-96d7-7ba3adfda69e'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('ae101129-988f-51b9-b2f0-6fad36db3198'::uuid, 'Complete 12 movement sessions (20-30 minutes each) and record what you did (12).', 12, 0),
  ('ae101129-988f-51b9-b2f0-6fad36db3198'::uuid, 'Make 8 ''better fuel'' choices (water over soda, fruit/veg, protein) and track each choice (8).', 8, 1),
  ('ae101129-988f-51b9-b2f0-6fad36db3198'::uuid, 'Do a weekly reset: set bedtime, plan snacks, and choose your exercise days (4 weekly plans).', 4, 2),
  ('cdd5622e-245c-54b4-8f6a-819bf8e7500f'::uuid, 'Practice a 2-minute breathing pattern (box breathing) 12 times when upset (track 12).', 12, 0),
  ('cdd5622e-245c-54b4-8f6a-819bf8e7500f'::uuid, 'Take 8 short ''cool-down'' walks (5-15 minutes) after stressful moments (8).', 8, 1),
  ('cdd5622e-245c-54b4-8f6a-819bf8e7500f'::uuid, 'Improve sleep on 8 nights by turning screens off 30 minutes earlier to reduce irritability (8).', 8, 2),
  ('b17bedc8-b760-5396-9add-71b437262421'::uuid, 'Move your body 20 days (walk, sport, workout) for 20+ minutes (track 20).', 20, 0),
  ('b17bedc8-b760-5396-9add-71b437262421'::uuid, 'Choose 10 recovery actions (stretching, hydration, sleep) and track them (10).', 10, 1),
  ('b17bedc8-b760-5396-9add-71b437262421'::uuid, 'End conflict with your body: replace one unhealthy habit (late-night scrolling, soda) 10 times (10). (add a short note about what you learned each time).', 10, 2),
  ('a81d774f-6401-5f26-9b55-6cd8cf44cc36'::uuid, 'Get a consistent bedtime on 10 nights (track 10).', 10, 0),
  ('a81d774f-6401-5f26-9b55-6cd8cf44cc36'::uuid, 'Do a 10-minute wind-down routine 14 times (stretch, pray, journal) (14).', 14, 1),
  ('a81d774f-6401-5f26-9b55-6cd8cf44cc36'::uuid, 'Take 6 recovery walks or gentle workouts (6).', 6, 2),
  ('9110b007-d63c-53e2-a4f4-fddb3dbf39f3'::uuid, 'Move 12 times (20-30 minutes) (12).', 12, 0),
  ('9110b007-d63c-53e2-a4f4-fddb3dbf39f3'::uuid, 'Choose 8 ''self-control'' wins (sleep, food, screen limits) and track (8).', 8, 1),
  ('9110b007-d63c-53e2-a4f4-fddb3dbf39f3'::uuid, 'Write 4 reflections: how did discipline change confidence and mood? (4).', 4, 2),
  ('9110b007-d63c-53e2-a4f4-fddb3dbf39f3'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('3ecfd02c-719a-50a9-88d7-7809588fa91a'::uuid, 'Sleep: hit your target bedtime 8 nights (8).', 8, 0),
  ('3ecfd02c-719a-50a9-88d7-7809588fa91a'::uuid, 'Movement: do 12 sessions (12).', 12, 1),
  ('3ecfd02c-719a-50a9-88d7-7809588fa91a'::uuid, 'Fuel: make 10 balanced snack/meal choices and record (10).', 10, 2),
  ('732eb0bf-b298-51cc-99b9-91a60fd5cab7'::uuid, 'Pick one metric (push-ups, mile time, plank) and record baseline (1).', 1, 0),
  ('732eb0bf-b298-51cc-99b9-91a60fd5cab7'::uuid, 'Train 12 sessions (12).', 12, 1),
  ('732eb0bf-b298-51cc-99b9-91a60fd5cab7'::uuid, 'Re-test at day 30 and record improvement (1).', 1, 2),
  ('42dc4de4-b323-5641-beba-6bab09567c37'::uuid, 'Complete 12 movement sessions (12).', 12, 0),
  ('42dc4de4-b323-5641-beba-6bab09567c37'::uuid, 'Sleep goal on 8 nights (8).', 8, 1),
  ('42dc4de4-b323-5641-beba-6bab09567c37'::uuid, 'Track 20 days of at least one healthy choice (20). (add a short note about what you learned each time).', 20, 2),
  ('dee3c883-a83e-5435-89c6-ecc6ea4bf701'::uuid, 'Choose 6 tasks that require effort (yardwork, cleanup, moving, shoveling, babysitting) (6 planned).', 6, 0),
  ('dee3c883-a83e-5435-89c6-ecc6ea4bf701'::uuid, 'Complete the 6 tasks and record date/time (6).', 6, 1),
  ('dee3c883-a83e-5435-89c6-ecc6ea4bf701'::uuid, 'Stretch/hydrate after 6 tasks to care for your body too (6).', 6, 2),
  ('1403b0a4-0e07-5914-8834-1c638196350a'::uuid, 'Write 5 ''replacement phrases'' (e.g., ''I''m learning,'' ''I can try again'') (5).', 5, 0),
  ('1403b0a4-0e07-5914-8834-1c638196350a'::uuid, 'Use replacements 20 times when you catch negative self-talk (track 20).', 20, 1),
  ('1403b0a4-0e07-5914-8834-1c638196350a'::uuid, 'Do 6 calming resets after harsh moments: breathe + kind self-talk (6).', 6, 2),
  ('1403b0a4-0e07-5914-8834-1c638196350a'::uuid, 'Do a final review: write 5 sentences on what changed from day 1 to the end (1).', 1, 3),
  ('8695cf9a-1324-56bc-a70c-700f469a710f'::uuid, 'Complete 12 movement sessions (20-30 minutes each) and record what you did (12).', 12, 0),
  ('8695cf9a-1324-56bc-a70c-700f469a710f'::uuid, 'Make 8 ''better fuel'' choices (water over soda, fruit/veg, protein) and track each choice (8).', 8, 1),
  ('8695cf9a-1324-56bc-a70c-700f469a710f'::uuid, 'Do a weekly reset: set bedtime, plan snacks, and choose your exercise days (4 weekly plans).', 4, 2)
)
insert into public.template_checklist_items (template_id, title, repeat_count, sort_order)
select seed_items.template_id, seed_items.title, seed_items.repeat_count, seed_items.sort_order
from seed_items
join public.goal_templates on goal_templates.id = seed_items.template_id;
comment on column public.goal_templates.template_approved is 'Whether an optional goal template has been reviewed and approved for youth use.';


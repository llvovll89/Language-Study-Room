/* TOEIC 시험 구성(공식 자료) + Part 5 문법 (형식은 data/toeic.js 주석 참고) */
export const TOEIC_ABOUT = [
  {id:"e-about", title:"시험 구성 한눈에 보기", sub:"TOEIC Listening & Reading / 托业 / Test format", type:"table", concept:true,
   note:[
    "TOEIC Listening & Reading은 듣기(LC) 100문항 45분, 읽기(RC) 100문항 75분으로 모두 200문항, 120분입니다. 점수는 듣기와 읽기 각 5~495점, 합계 10~990점입니다. (ETS, YBM 공식 안내)",
    "듣기에는 미국, 영국, 캐나다, 호주, 뉴질랜드 발음이 모두 나옵니다. 미국 발음만 익히지 말고 여러 발음을 들어 두세요. (YBM 출제 기준)",
    "출제 범위는 비즈니스(계약, 협상, 마케팅, 회의), 제조, 금융과 예산, 연구 개발, 사무실, 인사, 부동산, 여행입니다. 이 탭의 주제별 어휘도 이 범위를 따랐습니다.",
    "성적 유효기간은 시험일로부터 2년입니다. 시험 당일에는 규정 신분증(주민등록증, 운전면허증, 유효한 여권 등)이 꼭 필요하며, 대학생의 학생증은 인정되지 않습니다. 응시료와 시험 일정은 접수 전에 YBM 공식 사이트에서 확인하세요."
   ],
   head:["파트","이름","문항 수","내용","시간 · 배점"],
   rows:[
    ["Part 1","사진 묘사 (Photographs)","6","사진을 보고 네 문장 중 가장 알맞은 묘사 고르기","듣기 45분 · 495점"],
    ["Part 2","질의응답 (Question-Response)","25","질문이나 말을 듣고 알맞은 응답 고르기 (보기 3개)","듣기"],
    ["Part 3","짧은 대화 (Conversations)","39","두세 사람의 대화를 듣고 문제 3개씩 풀기 (13세트)","듣기"],
    ["Part 4","설명문 (Talks)","30","안내 방송, 회의 발표 등을 듣고 문제 3개씩 풀기 (10세트)","듣기"],
    ["Part 5","단문 빈칸 채우기 (Incomplete Sentences)","30","문법과 어휘: 문장 하나의 빈칸에 알맞은 말 고르기","읽기 75분 · 495점"],
    ["Part 6","장문 빈칸 채우기 (Text Completion)","16","이메일, 공지 등 글의 빈칸에 단어나 문장 넣기 (4세트)","읽기"],
    ["Part 7","독해 (Reading Comprehension)","54","단일 지문 29문항 + 복수 지문 25문항","읽기"],
    ["합계","7개 파트","200","듣기 100 + 읽기 100","120분 · 10~990점"]
   ]}
];

/* Part 5 문법 핵심과 실전 문제
   빈출 순서 참고: 서연주(2023, DBpia) 기출 분석은 명사 > 형용사 > 부사 > 전치사 > 절·접속사 > 한정사·대명사 > 시제 > 수동태 > to부정사 > 조동사 순으로 보고함
   문제는 모두 새로 만든 것이다 (ETS·YBM·교재 문항을 옮기지 않음) */
export const TOEIC_GRAMMAR = [
  {id:"e-grammar", title:"Part 5 문법 핵심", sub:"Part 5 / 语法 / Grammar points", type:"table", concept:true,
   note:[
    "Part 5에서 자주 나오는 유형은 품사 자리(명사, 형용사, 부사), 전치사와 접속사 구별, 관계대명사, 그리고 문맥에 맞는 어휘·짝꿍 표현입니다. 시제, 수동태, to부정사, 조동사도 꾸준히 나옵니다.",
    "문장 전체를 해석하기 전에 빈칸 앞뒤 두세 단어를 먼저 보세요. 빈칸 앞에 a/the가 있는지, 뒤에 명사가 오는지만 봐도 답이 나오는 문제가 많습니다.",
    "보기 네 개를 먼저 훑어 문제 유형을 정하세요. 같은 단어의 모양만 다르면(contribute, contribution, contributive) 품사 문제, 뜻이 다른 단어들이면 어휘 문제, despite/although처럼 섞여 있으면 전치사·접속사 문제입니다.",
    "품사·문법 문제는 해석 없이 빠르게 풀고, 남은 시간을 어휘 문제와 Part 7 독해에 쓰는 것이 시간 관리의 기본입니다."
   ],
   head:["포인트","규칙","예시"],
   rows:[
    ["품사 자리 (명사·형용사·부사)","a, the, 소유격(our, the company's)이나 형용사 뒤는 명사 자리입니다. be동사 뒤나 명사 앞은 형용사 자리입니다. 동사나 형용사를 꾸미거나, 빈칸이 없어도 문장이 완전하면 부사 자리입니다. 끝 모양(-tion 명사, -ive 형용사, -ly 부사)으로 구별하세요.","We need a quick response. / She is a reliable supplier. / The staff worked efficiently."],
    ["동사의 수 일치","주어가 하나면 동사에 -s(is, has, needs), 여럿이면 -s 없이(are, have, need) 씁니다. 주어 뒤에 붙은 'of + 명사' 같은 꾸밈말에 속지 말고 진짜 주어를 찾으세요. each, every 뒤는 단수입니다.","The list of new clients is on your desk."],
    ["시제 (시간 표현 단서)","문장 속 시간 표현이 답을 알려 줍니다. yesterday, last month, ago는 과거, next week, tomorrow는 미래(will), since, for three years는 현재완료(have p.p.), by the time + 미래 상황은 미래완료(will have p.p.)입니다.","Our team launched the website last month."],
    ["능동 vs 수동","주어가 직접 하면 능동, 주어가 당하면 수동(be + p.p.)입니다. 빈칸 뒤에 목적어(명사)가 없으면 수동태일 가능성이 큽니다.","The meeting will be held in Room 3."],
    ["전치사 vs 접속사","뒤에 명사(구)만 오면 전치사, 주어 + 동사가 있는 문장이 오면 접속사입니다. despite(전치사) / although(접속사), during / while, because of / because가 대표적인 짝입니다.","Despite the delay, we finished on time. / Although it was late, we finished."],
    ["관계대명사","앞의 명사를 뒤에서 설명할 때 씁니다. 사람이면 who, 사물이면 which, 둘 다 that이 가능합니다. 뒤에 명사가 바로 오고 '~의'라는 뜻이면 whose입니다. 콤마(,) 뒤에는 that을 쓰지 않습니다.","The manager who hired me is leaving. / a client whose order was late"],
    ["to부정사 vs 동명사","동사마다 뒤에 오는 모양이 정해져 있습니다. decide, plan, hope, agree, want 뒤는 to + 동사원형, consider, avoid, finish, suggest, recommend 뒤는 -ing입니다. 통째로 외우는 것이 가장 빠릅니다.","We decided to expand. / They are considering hiring more staff."],
    ["분사 (-ing vs -ed)","감정을 일으키는 쪽(사물, 소식)은 -ing, 감정을 느끼는 쪽(사람)은 -ed를 씁니다. 명사를 꾸밀 때도 '하는' 관계면 -ing, '된' 관계면 -ed입니다.","The news was exciting. / The employees were excited. / a revised schedule"],
    ["비교급과 최상급","than이 보이면 비교급(-er, more ~), the와 of/in 범위 표현이 보이면 최상급(-est, most ~)입니다. 비교급 앞의 much, far, considerably는 '훨씬'이라는 강조입니다.","This model is much lighter than the old one. / the largest branch in Asia"],
    ["대명사 격 (재귀대명사 포함)","주어 자리는 I, she, they, 목적어 자리는 me, her, them, 명사 앞은 my, her, their, '~의 것'은 mine, hers, theirs입니다. 주어가 직접 했다고 강조하거나 주어와 목적어가 같으면 myself, herself 같은 재귀대명사를 씁니다.","She reviewed the report herself."],
    ["상관접속사","짝이 정해진 표현입니다. both A and B(A와 B 둘 다), either A or B(A나 B 중 하나), neither A nor B(둘 다 아님), not only A but also B(A뿐 아니라 B도). 한쪽이 보이면 나머지 짝을 찾으세요.","You can pay either by card or in cash."],
    ["가정법·조동사","'If you should need'에서 If를 빼고 Should를 앞으로 보낸 'Should you need'는 '혹시 ~하면'이라는 공손한 표현입니다. 'if needed', 'if necessary'는 '필요하면'이라는 짧은 표현입니다. 조동사(will, can, should, must) 뒤에는 항상 동사원형이 옵니다.","Should you need help, call us. / Extra staff will be added if needed."]
   ]},
  {id:"e-part5", title:"Part 5 실전 문제", sub:"Part 5 / 练习题 / Practice questions", type:"problems",
   note:[
    "먼저 스스로 답을 고른 뒤 해설을 읽으세요. 정답 이유뿐 아니라 헷갈리는 오답이 왜 틀렸는지까지 확인해야 같은 함정에 다시 걸리지 않습니다.",
    "틀린 문제는 오답 노트에 자동으로 저장됩니다. 며칠 뒤 오답 노트만 다시 풀어 보면 약한 문법 포인트를 빠르게 보완할 수 있습니다.",
    "실제 시험의 Part 5는 30문항입니다. 익숙해지면 한 문제를 20~30초 안에 푸는 것을 목표로 연습하세요."
   ],
   items:[
    ["The marketing team made a significant _____ to the sales growth this quarter.",["contribute","contribution","contributive","contributed"],1,"a significant(관사 + 형용사) 뒤는 명사 자리이므로 contribution이 정답입니다. contributive는 형용사라서 형용사 뒤에 또 올 수 없습니다.","품사 자리: 명사"],
    ["Ms. Okafor's presentation was highly _____, so the board approved the budget right away.",["persuade","persuasion","persuasive","persuasively"],2,"be동사(was) 뒤에서 주어의 성질을 설명하고 부사 highly의 꾸밈을 받는 형용사 자리이므로 persuasive가 정답입니다. 부사 persuasively는 be동사의 보어가 될 수 없고, 명사 persuasion은 부사 highly의 꾸밈을 받지 않습니다.","품사 자리: 형용사"],
    ["The new software allows employees to process invoices more _____ than before.",["efficiently","efficient","efficiency","efficiencies"],0,"동사 process(처리하다)를 꾸며 '더 효율적으로 처리하다'가 되어야 하므로 부사 efficiently가 정답입니다. 형용사 efficient는 동사를 꾸밀 수 없습니다.","품사 자리: 부사"],
    ["The list of approved vendors _____ updated every month by the purchasing department.",["is","are","be","being"],0,"진짜 주어는 The list(단수)이므로 is가 정답입니다. 바로 앞의 vendors(복수)를 보고 are를 고르면 함정에 걸린 것입니다.","동사의 수 일치"],
    ["Gruber Logistics _____ its third warehouse in Busan last March.",["opens","will open","opened","has opened"],2,"last March는 과거를 나타내므로 과거 시제 opened가 정답입니다. 현재완료 has opened는 last March 같은 명확한 과거 시점과 함께 쓰지 않습니다.","시제"],
    ["By the time the auditors arrive next week, the accounting team _____ all the quarterly reports.",["completes","will have completed","had completed","has been completed"],1,"'다음 주에 감사관이 도착할 때쯤이면 이미 끝냈을 것'이므로 미래완료 will have completed가 정답입니다. had completed는 과거의 일에 쓰고, has been completed는 수동이라 뒤의 목적어 reports와 맞지 않습니다.","시제"],
    ["All visitors _____ to sign in at the front desk before entering the laboratory.",["ask","asking","to ask","are asked"],3,"방문객은 서명하라고 '요청받는' 쪽이므로 수동태 are asked가 정답입니다. ask는 능동이라 '방문객이 요청한다'는 엉뚱한 뜻이 되고, asking과 to ask는 문장의 동사가 될 수 없습니다.","능동 vs 수동"],
    ["The annual sales conference will _____ at the Westbrook Hotel from May 3 to May 5.",["hold","holding","have held","be held"],3,"회의는 '개최되는' 것이고 빈칸 뒤에 목적어가 없으므로 수동태 be held가 정답입니다. hold는 목적어가 필요한 동사라서 능동형 hold, have held는 쓸 수 없습니다.","능동 vs 수동"],
    ["_____ the heavy rain, the outdoor product launch went ahead as planned.",["Despite","Although","Even if","Whereas"],0,"빈칸 뒤에 동사 없이 명사구(the heavy rain)만 있으므로 전치사 Despite가 정답입니다. Although, Even if, Whereas는 모두 접속사라서 뒤에 주어 + 동사가 와야 합니다.","전치사 vs 접속사"],
    ["Please keep your mobile phone switched off _____ the training session is in progress.",["during","throughout","because of","while"],3,"빈칸 뒤에 주어(the training session)와 동사(is)가 있으므로 접속사 while이 정답입니다. during은 뜻은 비슷하지만 전치사라서 명사만 받습니다.","전치사 vs 접속사"],
    ["Employees _____ wish to attend the workshop should register by Friday.",["which","whose","who","whom"],2,"앞의 Employees(사람)를 설명하고 빈칸 뒤에 동사 wish가 바로 오므로 주격 관계대명사 who가 정답입니다. which는 사물에 쓰고, whom은 목적격이라 동사 앞 주어 자리에 올 수 없습니다.","관계대명사"],
    ["The company honored Mr. Delgado, _____ team exceeded its sales target by 20 percent.",["who","which","that","whose"],3,"빈칸 뒤에 명사 team이 바로 오고 'Mr. Delgado의 팀'이라는 뜻이므로 소유격 whose가 정답입니다. who를 넣으면 who team이 되어 문장이 성립하지 않고, 콤마 뒤에는 that을 쓰지 않습니다.","관계대명사"],
    ["After reviewing several proposals, the director decided _____ the contract with Halvorsen Printing.",["renewing","to renew","renewed","renewal"],1,"decide는 뒤에 to + 동사원형을 쓰는 동사이므로 to renew가 정답입니다. decide renewing처럼 -ing를 쓰지 않습니다.","to부정사 vs 동명사"],
    ["The board is considering _____ the headquarters to a larger building downtown.",["move","to move","moving","moved"],2,"consider는 뒤에 -ing를 쓰는 동사이므로 moving이 정답입니다. considering to move처럼 to부정사를 쓰는 것은 틀린 표현입니다.","to부정사 vs 동명사"],
    ["The results of the customer survey were _____ to the product development team.",["disappointing","disappointed","disappoint","disappointment"],0,"주어 results(결과)는 실망을 '일으키는' 쪽이므로 -ing 형태 disappointing이 정답입니다. disappointed는 사람이 실망을 '느낄' 때 씁니다.","분사 (-ing vs -ed)"],
    ["The new printer is considerably _____ than the old model it replaced.",["fast","faster","fastest","more fast"],1,"뒤에 than이 있으므로 비교급 faster가 정답입니다. fast처럼 짧은 단어는 -er을 붙이므로 more fast는 쓰지 않습니다.","비교급과 최상급"],
    ["Ms. Tanaka prepared the financial report _____ because her assistant was on vacation.",["she","her","hers","herself"],3,"문장이 이미 완전하고 '그녀가 직접' 준비했다고 강조하는 자리이므로 재귀대명사 herself가 정답입니다. her와 hers는 이 자리에서 뜻이 통하지 않습니다.","대명사 격"],
    ["Applicants must have _____ a degree in engineering and at least three years of relevant experience.",["both","either","neither","not only"],0,"뒤에 and가 있으므로 both A and B의 both가 정답입니다. either는 or, neither는 nor, not only는 but also와 짝을 이룹니다.","상관접속사"],
    ["_____ you need further assistance, please contact our customer service team at any time.",["Should","Were","Had","Whether"],0,"'혹시 도움이 더 필요하시면'이라는 뜻으로, If you should need에서 If를 빼고 Should를 앞으로 보낸 형태가 정답입니다. Were와 Had는 뒤의 동사원형 need와 어울리지 않습니다.","가정법·조동사"],
    ["If _____, the meeting can be moved to Thursday so that more managers can attend.",["need","needed","needing","needs"],1,"'필요하면'이라는 뜻의 굳어진 표현은 if needed(= if it is needed)이므로 needed가 정답입니다. 회의 변경이 '필요로 되는' 관계라서 -ing 형태 needing은 쓰지 않습니다.","가정법·조동사"],
    ["Customers who wish to return a product must present the original _____ of purchase.",["sign","view","proof","mark"],2,"proof of purchase는 '구매 증빙(영수증 등)'이라는 짝꿍 표현이므로 proof가 정답입니다. 나머지 단어는 of purchase와 어울려 이런 뜻을 만들지 못합니다.","어휘: 짝꿍 표현"],
    ["Due to high demand, the conference room must be reserved at least two days in _____.",["front","ahead","advance","before"],2,"in advance는 '미리'라는 뜻의 짝꿍 표현이므로 advance가 정답입니다. ahead와 before는 뜻이 비슷하지만 in 뒤에 붙여 쓰지 않습니다.","어휘: 짝꿍 표현"],
    ["The new travel expense policy will take _____ on July 1, so all staff should review it carefully.",["care","effect","part","turns"],1,"take effect는 '(규정 등이) 시행되다, 효력이 생기다'라는 뜻이므로 effect가 정답입니다. take part는 '참가하다', take care는 '돌보다·조심하다'라서 문맥에 맞지 않습니다.","어휘: 짝꿍 표현"],
    ["Mr. Osei is _____ for coordinating the company's annual charity event.",["aware","dependent","capable","responsible"],3,"be responsible for는 '~을 담당하다, 책임지다'라는 뜻이므로 responsible이 정답입니다. aware와 capable은 of와 함께 쓰고(aware of, capable of), dependent는 on과 함께 씁니다(dependent on).","어휘: 형용사 + 전치사"]
   ]}
];

/**
 * Flat vector illustrations for the homepage, drawn in Guide's palette.
 * Each scene fills its PhotoFrame shape (preserveAspectRatio "slice").
 */

const INK = "#1f2d27";
const SKIN = {
  a: "#f3c9a0",
  b: "#d9a06b",
  c: "#a8693c",
  d: "#6e4224",
};
const HAIR = {
  dark: "#2b1d16",
  brown: "#6b3f22",
  blond: "#d9a441",
  black: "#141414",
  auburn: "#9c4a22",
};

type HairStyle = "short" | "long" | "bun" | "curly" | "bob";

/** Front-facing person: head at (0,0), shoulders ~y=45, body to y=150. */
function Person({
  x,
  y,
  s = 1,
  skin,
  hair,
  shirt,
  style = "short",
  arm,
  smile = true,
}: {
  x: number;
  y: number;
  s?: number;
  skin: string;
  hair: string;
  shirt: string;
  style?: HairStyle;
  arm?: "left" | "right";
  smile?: boolean;
}) {
  const dir = arm === "right" ? 1 : -1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {style === "long" && (
        <path
          d="M-36 -6 C-44 40 -38 78 -24 92 L24 92 C38 78 44 40 36 -6 Z"
          fill={hair}
        />
      )}
      {style === "bob" && (
        <path d="M-37 -4 C-40 26 -36 44 -26 50 L26 50 C36 44 40 26 37 -4 Z" fill={hair} />
      )}
      {arm && (
        <>
          <path
            d={`M${dir * 38} 78 C${dir * 52} 40 ${dir * 58} 0 ${dir * 60} -42`}
            stroke={shirt}
            strokeWidth={20}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={dir * 60} cy={-50} r={12} fill={skin} />
        </>
      )}
      <path
        d="M-54 160 L-54 98 C-54 64 -32 46 0 46 C32 46 54 64 54 98 L54 160 Z"
        fill={shirt}
      />
      <path d="M-14 46 Q0 62 14 46 Z" fill={skin} opacity={0.9} />
      <rect x={-9} y={20} width={18} height={30} rx={7} fill={skin} />
      <circle r={31} fill={skin} />
      {style === "curly" ? (
        <g fill={hair}>
          {[-26, -13, 0, 13, 26].map((cx, i) => (
            <circle key={cx} cx={cx} cy={-22 - (i % 2) * 6} r={13} />
          ))}
          <circle cx={-30} cy={-6} r={10} />
          <circle cx={30} cy={-6} r={10} />
        </g>
      ) : (
        <path
          d="M-32 -2 C-33 -30 -15 -40 0 -40 C19 -40 34 -29 32 -2 C25 -17 10 -21 -5 -19 C-17 -17 -27 -11 -32 -2 Z"
          fill={hair}
        />
      )}
      {style === "bun" && <circle cx={0} cy={-44} r={13} fill={hair} />}
      <circle cx={-10} cy={2} r={3.4} fill={INK} />
      <circle cx={10} cy={2} r={3.4} fill={INK} />
      {smile ? (
        <path d="M-9 13 Q0 21 9 13" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
      ) : (
        <path d="M-6 15 L6 15" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      )}
      <circle cx={-18} cy={11} r={5} fill="#e8876b" opacity={0.35} />
      <circle cx={18} cy={11} r={5} fill="#e8876b" opacity={0.35} />
    </g>
  );
}

/** Person seen from behind (classroom foreground). */
function Back({
  x,
  y,
  s = 1,
  hair,
  shirt,
  skin,
  arm,
}: {
  x: number;
  y: number;
  s?: number;
  hair: string;
  shirt: string;
  skin: string;
  arm?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {arm && (
        <>
          <path d="M34 78 C48 40 54 0 56 -40" stroke={shirt} strokeWidth={20} strokeLinecap="round" fill="none" />
          <circle cx={56} cy={-48} r={12} fill={skin} />
        </>
      )}
      <path d="M-54 160 L-54 98 C-54 64 -32 46 0 46 C32 46 54 64 54 98 L54 160 Z" fill={shirt} />
      <rect x={-9} y={20} width={18} height={30} rx={7} fill={skin} />
      <circle r={31} fill={hair} />
    </g>
  );
}

function Svg({
  w,
  h,
  label,
  children,
}: {
  w: number;
  h: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={label}
      width="100%"
      height="100%"
    >
      {children}
    </svg>
  );
}

/** Hero: student with headphones at a laptop, apps floating around her. */
export function HeroStudentArt() {
  return (
    <Svg w={500} h={600} label="Illustration of a smiling student with headphones working on a laptop">
      <defs>
        <linearGradient id="hs-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dff1e6" />
          <stop offset="1" stopColor="#bfe2cd" />
        </linearGradient>
      </defs>
      <rect width={500} height={600} fill="url(#hs-bg)" />
      <circle cx={380} cy={130} r={70} fill="#f2d98a" opacity={0.7} />
      {/* floating app tiles */}
      <g>
        <rect x={60} y={110} width={74} height={74} rx={20} fill="#2459c4" />
        <text x={97} y={160} textAnchor="middle" fontSize={40} fontWeight={800} fill="#fff" fontFamily="system-ui, sans-serif">T</text>
      </g>
      <g transform="rotate(10 400 300)">
        <rect x={370} y={262} width={64} height={64} rx={18} fill="#8f620c" />
        <path d="M402 278 l7 15 16 2 -12 11 3 16 -14 -8 -14 8 3 -16 -12 -11 16 -2 Z" fill="#fff" />
      </g>
      <g transform="rotate(-8 90 330)">
        <rect x={52} y={300} width={64} height={64} rx={18} fill="#367553" />
        <path d="M68 333 l10 11 22 -22" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
      {/* student */}
      <Person x={250} y={300} s={1.45} skin={SKIN.a} hair={HAIR.brown} shirt="#367553" style="long" />
      {/* headphones */}
      <g transform="translate(250 300) scale(1.45)">
        <path d="M-38 4 C-40 -46 40 -46 38 4" stroke="#7b5cc4" strokeWidth={8} fill="none" strokeLinecap="round" />
        <rect x={-46} y={-8} width={16} height={28} rx={7} fill="#9b7be0" />
        <rect x={30} y={-8} width={16} height={28} rx={7} fill="#9b7be0" />
      </g>
      {/* desk + laptop */}
      <rect x={0} y={492} width={500} height={108} fill="#2f6a4c" />
      <path d="M150 498 L170 390 L330 390 L350 498 Z" fill="#dfe6e2" />
      <path d="M160 498 L178 400 L322 400 L340 498 Z" fill="#c9d3ce" />
      <circle cx={250} cy={448} r={13} fill="#fff" opacity={0.85} />
      <rect x={120} y={494} width={260} height={12} rx={6} fill="#e9eeeb" />
    </Svg>
  );
}

/** Teacher at the board, students raising hands. */
export function TeacherClassArt() {
  return (
    <Svg w={500} h={500} label="Illustration of a teacher at a chalkboard with students raising their hands">
      <rect width={500} height={500} fill="#f6efd9" />
      <rect x={40} y={60} width={300} height={190} rx={14} fill="#2a4d3c" />
      <rect x={40} y={244} width={300} height={12} rx={6} fill="#b98a4a" />
      <g stroke="#e8f2ec" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.9}>
        <path d="M70 110 h60 M100 90 v40" />
        <path d="M150 110 h60" />
        <path d="M70 170 q20 -30 40 0 t40 0" />
        <path d="M230 150 l30 40 l40 -70" />
      </g>
      <Person x={400} y={200} s={1.05} skin={SKIN.c} hair={HAIR.black} shirt="#c0573e" style="bun" arm="left" />
      <rect x={0} y={400} width={500} height={100} fill="#d8c79e" />
      <Back x={110} y={380} s={0.95} hair={HAIR.blond} shirt="#2459c4" skin={SKIN.a} arm />
      <Back x={250} y={395} s={0.95} hair={HAIR.dark} shirt="#367553" skin={SKIN.b} />
      <Back x={385} y={385} s={0.95} hair={HAIR.brown} shirt="#8f620c" skin={SKIN.d} arm />
    </Svg>
  );
}

/** Student portal on a tablet with a message from the teacher. */
export function StudentTabletArt() {
  return (
    <Svg w={500} h={625} label="Illustration of a student holding a tablet that shows their class apps">
      <rect width={500} height={625} fill="#e3eefb" />
      <circle cx={90} cy={110} r={56} fill="#ffffff" opacity={0.7} />
      <circle cx={420} cy={520} r={90} fill="#cfe0f6" />
      {/* message bubble */}
      <g>
        <rect x={250} y={70} width={210} height={84} rx={22} fill="#fff" />
        <path d="M290 150 l-10 26 30 -22 Z" fill="#fff" />
        <circle cx={284} cy={112} r={18} fill="#367553" />
        <rect x={312} y={96} width={120} height={12} rx={6} fill="#2f6a4c" />
        <rect x={312} y={118} width={90} height={10} rx={5} fill="#b9c8c0" />
      </g>
      <Person x={250} y={300} s={1.4} skin={SKIN.d} hair={HAIR.black} shirt="#24704a" style="curly" />
      {/* tablet held in front */}
      <g transform="rotate(-6 250 500)">
        <rect x={140} y={410} width={220} height={160} rx={18} fill="#1f2d27" />
        <rect x={152} y={422} width={196} height={136} rx={10} fill="#f6fbf8" />
        <rect x={168} y={440} width={48} height={48} rx={12} fill="#2459c4" />
        <rect x={226} y={440} width={48} height={48} rx={12} fill="#367553" />
        <rect x={284} y={440} width={48} height={48} rx={12} fill="#8f620c" />
        <rect x={168} y={500} width={164} height={12} rx={6} fill="#cfdcd5" />
        <rect x={168} y={522} width={110} height={12} rx={6} fill="#cfdcd5" />
      </g>
      <circle cx={150} cy={500} r={20} fill={SKIN.d} />
      <circle cx={352} cy={478} r={20} fill={SKIN.d} />
    </Svg>
  );
}

/** Live quiz answer tiles with excited kids. */
export function QuizClassArt() {
  return (
    <Svg w={500} h={500} label="Illustration of excited students raising their hands in front of colorful quiz answers">
      <rect width={500} height={500} fill="#eef2fb" />
      <g>
        <rect x={50} y={50} width={190} height={92} rx={18} fill="#2459c4" />
        <path d="M96 118 l22 -40 22 40 Z" fill="#fff" />
        <rect x={260} y={50} width={190} height={92} rx={18} fill="#24704a" />
        <rect x={326} y={76} width={40} height={40} rx={6} transform="rotate(45 346 96)" fill="#fff" />
        <rect x={50} y={158} width={190} height={92} rx={18} fill="#8f620c" />
        <circle cx={118} cy={204} r={22} fill="#fff" />
        <rect x={260} y={158} width={190} height={92} rx={18} fill="#a33a50" />
        <rect x={326} y={184} width={40} height={40} rx={4} fill="#fff" />
      </g>
      <g fill="#f2c94c">
        <circle cx={30} cy={290} r={6} />
        <rect x={468} y={286} width={12} height={12} rx={2} transform="rotate(20 474 292)" />
        <circle cx={460} cy={30} r={5} />
      </g>
      <rect x={0} y={430} width={500} height={70} fill="#d7def0" />
      <Person x={120} y={340} s={0.95} skin={SKIN.b} hair={HAIR.auburn} shirt="#c0573e" style="bob" arm="left" />
      <Person x={250} y={325} s={1} skin={SKIN.a} hair={HAIR.blond} shirt="#2459c4" style="bun" arm="right" />
      <Person x={380} y={340} s={0.95} skin={SKIN.c} hair={HAIR.dark} shirt="#367553" style="short" arm="right" />
    </Svg>
  );
}

/** Administrator with an approval checklist in front of the school. */
export function AdminSchoolArt() {
  return (
    <Svg w={500} h={625} label="Illustration of a school administrator holding a checklist in front of a school building">
      <rect width={500} height={625} fill="#fbf3dc" />
      {/* school building */}
      <g>
        <rect x={60} y={170} width={380} height={230} fill="#e7d3a6" />
        <path d="M40 176 L250 70 L460 176 Z" fill="#c0573e" />
        <rect x={235} y={20} width={4} height={60} fill="#6b4a2e" />
        <path d="M239 22 h40 l-8 12 8 12 h-40 Z" fill="#367553" />
        {[90, 160, 300, 370].map((x) => (
          <rect key={x} x={x} y={210} width={44} height={50} rx={6} fill="#fff" opacity={0.85} />
        ))}
        <circle cx={250} cy={140} r={18} fill="#fff" opacity={0.85} />
      </g>
      <rect x={0} y={400} width={500} height={225} fill="#cfe5d6" />
      <Person x={250} y={350} s={1.35} skin={SKIN.b} hair={HAIR.brown} shirt="#2f3f5c" style="long" />
      {/* clipboard */}
      <g transform="rotate(-4 250 520)">
        <rect x={180} y={440} width={140} height={170} rx={12} fill="#b98a4a" />
        <rect x={192} y={456} width={116} height={146} rx={6} fill="#fff" />
        <rect x={225} y={432} width={50} height={18} rx={6} fill="#6b4a2e" />
        {[478, 516, 554].map((y) => (
          <g key={y}>
            <circle cx={212} cy={y} r={11} fill="#367553" />
            <path d={`M206 ${y} l5 5 8 -9`} stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <rect x={230} y={y - 5} width={64} height={10} rx={5} fill="#cfdcd5" />
          </g>
        ))}
      </g>
      <circle cx={186} cy={540} r={18} fill={SKIN.b} />
      <circle cx={316} cy={528} r={18} fill={SKIN.b} />
    </Svg>
  );
}

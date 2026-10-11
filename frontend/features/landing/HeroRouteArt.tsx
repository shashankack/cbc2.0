"use client";

import Box from "@mui/material/Box";

/** Isometric route + shuttle art adapted from Uni-Transit landing. */
export default function HeroRouteArt() {
  return (
    <Box
      component="svg"
      viewBox="0 0 640 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Campus shuttle route on an isometric map"
      sx={{
        width: "100%",
        maxWidth: 640,
        height: "auto",
        overflow: "visible",
        "@keyframes utBusFloat": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "@keyframes utPulse": {
          "0%, 100%": { opacity: 0.85 },
          "50%": { opacity: 1 },
        },
        "& .ut-bus": {
          animation: "utBusFloat 4.5s ease-in-out infinite",
          transformOrigin: "center",
        },
        "& .ut-route": {
          animation: "utPulse 3.2s ease-in-out infinite",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& .ut-bus, & .ut-route": { animation: "none" },
        },
      }}
    >
      <defs>
        <linearGradient
          id="utRoadFade"
          x1="440"
          y1="275"
          x2="70"
          y2="485"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1E293B" stopOpacity="1" />
          <stop offset="75%" stopColor="#1E293B" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="utScreen"
          x1="380"
          y1="50"
          x2="560"
          y2="400"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient
          id="utHeadlight"
          x1="255"
          y1="380"
          x2="110"
          y2="465"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FDE68A" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g stroke="#1E293B" strokeWidth="2">
        <line x1="60" y1="340" x2="390" y2="150" />
        <line x1="130" y1="410" x2="510" y2="190" />
        <line x1="210" y1="470" x2="610" y2="240" />
        <line x1="160" y1="200" x2="500" y2="395" />
        <line x1="80" y1="265" x2="395" y2="445" />
      </g>

      <polygon
        points="60,465 420,258 490,298 130,505"
        fill="url(#utRoadFade)"
      />
      <line x1="60" y1="465" x2="420" y2="258" stroke="#334155" strokeWidth="2" />
      <line x1="130" y1="505" x2="490" y2="298" stroke="#334155" strokeWidth="2" />
      <line
        x1="95"
        y1="485"
        x2="455"
        y2="278"
        stroke="#64748B"
        strokeWidth="2.5"
        strokeDasharray="12 12"
        strokeLinecap="round"
      />

      <g>
        <path
          d="M548,124 L564,115 C572,111 578,117 578,128 L578,392 C578,402 572,408 564,412 L548,421 Z"
          fill="#090D16"
          stroke="#334155"
          strokeWidth="1.5"
        />
        <path
          d="M376,42 C376,28 386,23 398,30 L544,114 C556,121 565,137 565,150 L565,405 C565,418 556,424 544,417 L398,333 C386,326 376,310 376,297 Z"
          fill="#090D16"
          stroke="#334155"
          strokeWidth="2"
        />
        <path
          d="M386,55 C386,45 394,41 402,46 L538,124 C546,129 553,140 553,150 L553,392 C553,402 546,406 538,401 L402,323 C394,318 386,307 386,297 Z"
          fill="url(#utScreen)"
        />
        <path
          d="M425,59 L445,122 L420,195 L422,334 L404,324 L402,185 L425,118 L406,50 Z"
          fill="#14B8A6"
          fillOpacity="0.16"
        />
        <polyline
          className="ut-route"
          points="524,152 524,222 470,192 470,268 490,296 490,348 446,322"
          fill="none"
          stroke="#2DD4BF"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="524" cy="152" r="7" fill="#2DD4BF" />
        <circle cx="524" cy="222" r="7" fill="#2DD4BF" />
        <circle cx="470" cy="192" r="7" fill="#2DD4BF" />
        <ellipse
          cx="480"
          cy="282"
          rx="13"
          ry="16"
          transform="rotate(-25 480 282)"
          fill="#0F172A"
          stroke="#F8FAFC"
          strokeWidth="3"
        />
        <ellipse
          cx="480"
          cy="282"
          rx="6"
          ry="8"
          transform="rotate(-25 480 282)"
          fill="#2DD4BF"
        />
        <circle cx="490" cy="348" r="7" fill="#2DD4BF" />
      </g>

      <g className="ut-bus">
        <polygon
          points="242,388 110,464 145,484 262,400"
          fill="url(#utHeadlight)"
        />
        <polygon
          points="274,406 145,484 182,502 294,418"
          fill="url(#utHeadlight)"
        />
        <polygon
          points="232,396 385,306 442,340 288,430"
          fill="#020617"
          opacity="0.55"
        />
        <polygon points="238,328 296,362 296,412 238,378" fill="#F59E0B" />
        <polygon
          points="244,336 290,363 290,389 244,362"
          fill="#0F172A"
          stroke="#38BDF8"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
        <circle cx="247" cy="375" r="3.5" fill="#FEF08A" />
        <circle cx="286" cy="398" r="3.5" fill="#FEF08A" />
        <polygon points="296,362 430,284 430,334 296,412" fill="#D97706" />
        <polygon
          points="296,389 430,311 430,318 296,396"
          fill="#0F172A"
          opacity="0.8"
        />
        <polygon points="238,328 372,250 430,284 296,362" fill="#FBBF24" />
        <ellipse
          cx="322"
          cy="397"
          rx="11"
          ry="14"
          transform="rotate(25 322 397)"
          fill="#090D16"
          stroke="#475569"
          strokeWidth="2.5"
        />
        <ellipse
          cx="402"
          cy="350"
          rx="11"
          ry="14"
          transform="rotate(25 402 350)"
          fill="#090D16"
          stroke="#475569"
          strokeWidth="2.5"
        />
      </g>
    </Box>
  );
}

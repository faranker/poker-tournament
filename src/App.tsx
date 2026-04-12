// Poker Tournament Timer (Browser Version)
// React + styled-components
// Full Feature Version
import { useState, useEffect } from "react";
import styled from "styled-components";

/* =====================
   Styled Components
===================== */

const App = styled.div`
  background: #0b0b0b;
  color: #fff;
  min-height: 100vh;
  padding: 20px;
  font-family: Inter, system-ui, sans-serif;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 450px 1fr 360px;
  gap: 20px;
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const Card = styled.div`
  background: #141414;
  border-radius: 14px;
  padding: 16px;
`;

const Title = styled.h2`
  font-size: 18px;
  margin-bottom: 12px;
`;

const Subtitle = styled.h3`
  font-size: 14px;
  margin-bottom: 8px;
`;

const BigTimer = styled.div`
  font-size: 120px;
  font-weight: 700;
  text-align: center;
`;

const Progress = styled.div<{ percent: number }>`
  height: 10px;
  background: #222;
  border-radius: 6px;
  overflow: hidden;
  margin: 12px 0;

  div {
    height: 100%;
    background: #e50914;
    width: ${(p) => p.percent}%;
  }
`;

const Button = styled.button<{ type?: string; }>`
  ${props => props.type === 'secondary' && "background: #333;"}

  ${props => props.type === 'primary' && "background: #e50914;"}

  ${props => props.type === 'success' && "background: #439d03;"}

  ${props => props.type === 'info' && "background: #17a2b8;"}

  ${props => props.type === 'discord' && "background: #7289da;"}

  border: none;
  color: #fff;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  margin-right: 8px;

  &:hover { opacity: .9 }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  th, td {
    padding: 6px;
    border-bottom: 1px solid #222;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  box-sizing: border-box;
`;

const WrapperHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

/* =====================
   Helpers
===================== */

const levelUpSound = new Audio("/sounds/short-alarm-clock.mp3");

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

const formatNumber = (num: number) => {
  if (!num && num !== 0) return "";
  return num.toLocaleString("en-US");
};

/* =====================
   App
===================== */

export default function PokerTournamentTimer() {
  const [tournament, setTournament] = useState({
    name: "Main Event",
    buyIn: 200,
    players: 7,
    rebuys: 0,
    payouts: [50, 30, 20],
    rounds: [
      { sb: 100, bb: 200, ante: 200, duration: 10 * 60 },
      { sb: 200, bb: 400, ante: 400, duration: 10 * 60 },
      { sb: 400, bb: 800, ante: 800, duration: 10 * 60 }
    ]
  });

  const [openModal, setOpenModal] = useState(false);

  const [newLevel, setNewLevel] = useState({
    sb: 0,
    bb: 0,
    ante: 0,
    duration: 0,
  });

  const [roundIndex, setRoundIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(tournament.rounds[0].duration);
  const [running, setRunning] = useState(false);
  const [breakTime, setBreakTime] = useState(false);
  const [players, setPlayers] = useState<{ name: string; count: number, bounty: number; }[]>([]);
  const [prizeWinners, setPrizeWinners] = useState<{
    name: string;
    amount: number; // เงินรางวัล
    count: number;  // จำนวน buy-in
    profit: number; // กำไร/ขาดทุน
  }[]>([]);
  const [modeBounty, setModeBounty] = useState(false);
  const [bountyPercent, setBountyPercent] = useState(20);

  const round = tournament.rounds[roundIndex];

  const playLevelUpSound = () => {
    levelUpSound.currentTime = 0;
    levelUpSound.play().catch(() => {
      // กัน error browser block autoplay
    });
  };

  useEffect(() => {
  const r = tournament.rounds[roundIndex];
  if (r) {
    setTimeLeft(r.duration);
  }
}, [roundIndex]);

  /* Timer */
  useEffect(() => {
  if (!running) return;

  if (timeLeft <= 0) {
    playLevelUpSound();
    // ⏭ ไป level ถัดไปอัตโนมัติ
    setRoundIndex((prev) => {
      const next = prev + 1;

      if (next >= tournament.rounds.length) {
        setRunning(false); // 🛑 จบ tournament
        return prev;
      }

      // ⏱ reset time ของ level ใหม่
      setTimeLeft(tournament.rounds[next].duration);
      return next;
    });

    return;
  }

  const timer = setInterval(() => {
    setTimeLeft((t) => t - 1);
  }, 1000);

    return () => clearInterval(timer);
  }, [running, timeLeft, tournament.rounds]);

  useEffect(() => {
    levelUpSound.load();
  }, []);

  /* Prize */
  // const prizePool = (players.length + tournament.rebuys) * tournament.buyIn;
  // const prizes = tournament.payouts.map((p) => Math.floor((p / 100) * prizePool));

  const progress = (timeLeft / round.duration) * 100;

  const addPlayer = () => {
    const name = prompt("Player Name");
    if (!name) return;
    // setPlayers((p) => [...p, { name, count: 1 }]);
    setPlayers((p) => [...p, { name, count: 1, bounty: 0 }]);
  }

  const MAX_WINNERS = tournament.payouts.length;

  const totalBuyIn = players.reduce((sum, p) => sum + p.count, 0);
  const prizePool = totalBuyIn * tournament.buyIn;
  // const prizes = tournament.payouts.map((percent: number) => {
  //   return Math.floor((percent / 100) * prizePool);
  // });
  

  const totalEntries = players.reduce((sum, p) => sum + p.count, 0);

const bountyPool = modeBounty
  ? prizePool * (bountyPercent / 100)
  : 0;

const normalPrizePool = prizePool - bountyPool;

const totalKnockouts = totalEntries > 0 ? totalEntries : 0;

const bountyPerHead =
  totalKnockouts > 0 ? bountyPool / totalKnockouts : 0;

  const prizes = tournament.payouts.map((percent: number) => {
  return Math.floor((percent / 100) * normalPrizePool);
});
  // const totalPercent = tournament.payouts.reduce((sum, p) => sum + p, 0);
  // const totalPrize = totalBuyIn * tournament.buyIn;

  const isWinner = (name: string) =>
  prizeWinners.some((w) => w.name === name);

  const getPosition = (name: string) => {
    const index = prizeWinners.findIndex((w) => w.name === name);
    return index !== -1 ? index + 1 : null;
  };

  const totalBounty = players.reduce(
  (sum, p) => sum + (p.bounty || 0),
  0
);

if (modeBounty && totalBounty > totalKnockouts) {
  console.warn("Bounty เกินจำนวนที่เป็นไปได้");
}

  const getBadgeStyle = (pos: number) => {
    switch (pos) {
      case 1:
        return { background: 'gold', color: '#000' };
      case 2:
        return { background: 'silver', color: '#000' };
      case 3:
        return { background: '#cd7f32', color: '#fff' }; // bronze
      default:
        return { background: '#444', color: '#fff' };
    }
  };

  const selectPlayer = (p: { name: string; count: number }) => {
    setPrizeWinners((prev) => {
      const index = prev.findIndex((w) => w.name === p.name);

      // ❌ ถ้าคลิกซ้ำ → ลบออก
      if (index !== -1) {
        return prev.filter((w) => w.name !== p.name);
      }

      // ❌ ถ้าเต็มแล้ว → ไม่เพิ่ม
      if (prev.length >= MAX_WINNERS) return prev;

      if (prev.length >= tournament.payouts.length) return prev;

      const position = prev.length;
      const prize = prizes[position] || 0;

      const cost = p.count * tournament.buyIn;
      const profit = prize - cost;

      return [
        ...prev,
        {
          name: p.name,
          amount: prize,
          count: p.count,
          profit,
        },
      ];
    });
  };

  const allResults = players.map((p) => {
    const winner = prizeWinners.find((w) => w.name === p.name);

    const rankPrize = winner ? winner.amount : 0;
    const bountyPrize = modeBounty ? (p.bounty || 0) * bountyPerHead : 0;

    const totalWin = rankPrize + bountyPrize;
    const cost = p.count * tournament.buyIn;
    const profit = totalWin - cost;

    return {
      name: p.name,
      count: p.count,
      prize: rankPrize,
      bounty: bountyPrize,
      total: totalWin,
      profit,
    };
  }).sort((a, b) => b.profit - a.profit);

//   const shareResults = async () => {
//   const text = generateSummaryText();

//   if (navigator.share) {
//     try {
//       await navigator.share({
//         title: "Poker Tournament Result",
//         text,
//       });
//     } catch (err) {
//       console.log("share cancelled");
//     }
//   } else {
//     // fallback
//     navigator.clipboard.writeText(text);
//     alert("Copy แล้ว ไปวางใน LINE ได้เลย");
//   }
// };

const generateSummaryText = () => {
  let text = `🏆 ${tournament.name}\n\n`;

  text += `วันที่: ${new Date().toLocaleDateString()}\n`;
  text += `Buy-In: ${tournament.buyIn}\n`;

  text += `ผู้เล่นทั้งหมด: ${players.length}\n`;
  text += `Buy in ทั้งหมด: ${totalBuyIn}\n`;
  
  if (modeBounty) {
    text += `Prize Pool: ${prizePool - bountyPool}\n`;
    text += `Bounty Pool: ${bountyPool}\n`;
    text += `ต่อหัว: ${bountyPerHead.toFixed(2)}\n\n`;
  } else {
    text += `Prize Pool: ${prizePool}\n\n`;
  }

  text += "อันดับและเงินรางวัล:\n";
  prizeWinners.forEach((w, i) => {
    text += `${i + 1 === 1 ? "🥇" : i + 1 === 2 ? "🥈" : i + 1 === 3 ? "🥉" : i + 1} #${w.name} - ${w.amount}\n`;
  });

  text += "\nผู้เล่นทั้งหมด:\n";
  players.forEach((p) => {
    const winner = prizeWinners.find(w => w.name === p.name);
    const prize = winner ? winner.amount : 0;
    const cost = p.count * tournament.buyIn;
    const profit = modeBounty ? prize + (p.bounty || 0) * bountyPerHead - cost : prize - cost;

    text += `#${p.name} (${p.count} buy-in รวม ${cost}) → ${modeBounty ? `(Bounty: ${p.bounty || 0} รวม ${(p.bounty || 0) * bountyPerHead})` : ""}${profit >= 0 ? "+" : ""}${profit}\n`;
  });

  return text;
};

const sendToTelegram = async () => {
  const text = generateSummaryText();

  const TOKEN = '8759551562:AAFT_chi96Y5fiYKBSuEjOfsFFZYpzgrX-4';
  const CHAT_ID = "-5124726087";

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
    }),
  });

  alert("ส่งเข้า Telegram แล้ว!");
};

  const sendToDiscord = async () => {
    const text = generateSummaryText();

    const WEBHOOK_URL = "https://discord.com/api/webhooks/1492787869746597900/zzSKIyFpSJ-DVlf00rOigODrFHLLiz4xRJ0_rKrJ3D3GGY4d9n2-TPELJFJveiOCO6d8";

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [
          {
            title: tournament.name,
            description: text,
            color: 0xe50914,
          },
        ],
      }),
    });

    alert("ส่งเข้า Discord แล้ว!");
  };

  return (
    <App>

      {openModal && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#111",
              padding: 20,
              borderRadius: 12,
              width: 300,
            }}
          >
            <h3 style={{ marginBottom: 10 }}>Add Level</h3>
            <Subtitle>Small Blind</Subtitle>
            <Input
              placeholder="Small Blind"
              type="text"
              value={newLevel.sb}
              onChange={(e: any) =>
                setNewLevel((s) => ({ ...s, sb: Number(e.target.value) }))
              }
            />
            
            <Subtitle>Big Blind</Subtitle>
            <Input
              placeholder="Big Blind"
              type="text"
              value={newLevel.bb}
              onChange={(e: any) =>
                setNewLevel((s) => ({ ...s, bb: Number(e.target.value) }))
              }
            />

            <Subtitle>Ante</Subtitle>
            <Input
              placeholder="Ante"
              type="text"
              value={newLevel.ante}
              onChange={(e: any) =>
                setNewLevel((s) => ({ ...s, ante: Number(e.target.value) }))
              }
            />

            <Subtitle>Duration (Min)</Subtitle>
            <Input
              placeholder="Duration (Min)"
              type="text"
              value={newLevel.duration}
              onChange={(e: any) =>
                setNewLevel((s) => ({ ...s, duration: Number(e.target.value) }))
              }
            />

            <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
              <Button
                type="primary"
                onClick={() => {
                  setTournament((t) => ({
                    ...t,
                    rounds: [...t.rounds, {
                      ...newLevel,
                      duration: newLevel.duration * 60
                    }],
                  }));

                  // reset form
                  setNewLevel({ sb: 0, bb: 0, ante: 0, duration: 0 });
                  setOpenModal(false);
                }}
              >
                Add
              </Button>

              <Button type="secondary" onClick={() => setOpenModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      <Grid>
        {/* Structure */}
        <Card>
          <WrapperHeader>
            <Title>Structure</Title>
            <Button type="primary" onClick={() => setOpenModal(true)}>
              + Add Level
            </Button>
          </WrapperHeader>
          
          <Table>
            <thead>
              <tr>
                <th>SB</th>
                <th>BB</th>
                <th>Ante</th>
                <th>Min</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tournament.rounds.map((r, i) => (
                <tr
                  key={i}
                  style={{ color: i === roundIndex ? "#e50914" : "#fff" }}
                >
                  {/* SB */}
                  <td style={{ textAlign: 'center' }}>
                    {r.sb ? formatNumber(r.sb) : "-"}
                  </td>

                  {/* BB */}
                  <td style={{ textAlign: 'center' }}>
                    {r.bb ? formatNumber(r.bb) : "-"}
                  </td>

                  {/* Ante */}
                  <td style={{ textAlign: 'center' }}>
                    {r.ante ? formatNumber(r.ante) : "-"}
                  </td>

                  {/* Duration */}
                  <td style={{ textAlign: 'center' }}>
                    {fmt(r.duration)}
                  </td>

                  {/* Remove */}
                  <td>
                    <Button
                      type="primary"
                      onClick={() => {
                        const ok = window.confirm("ลบ level นี้?");
                        if (!ok) return;

                        setTournament((t) => ({
                          ...t,
                          rounds: t.rounds.filter((_, idx) => idx !== i),
                        }));
                      }}
                    >
                      -
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {/* <Button secondary onClick={() => {
            const r = prompt("SB,BB,ANTE,DURATION(sec)");
            if (!r) return;
            const [sb, bb, ante, d] = r.split(",").map(Number);
            setTournament(t => ({ ...t, rounds: [...t.rounds, { sb, bb, ante, duration: d }] }));
          }}>+ Add Level</Button> */}
        </Card>

        {/* Timer */}
        <Card style={{ textAlign: "center" }}>
          <Title>{breakTime ? "Break" : `Level ${roundIndex + 1}`}</Title>
          <BigTimer>{fmt(timeLeft)}</BigTimer>
          <Progress percent={progress}><div /></Progress>
          <Button
            type="primary"
            onClick={() => {
              // 🔥 ถ้าเวลาหมดแล้ว → reset ก่อน
              if (timeLeft <= 0) {
                setTimeLeft(round.duration);
              }
              setRunning((r) => !r);
            }}
          >
            {running ? "Pause" : "Start"}
          </Button>
          <Button type="secondary"
            onClick={() => {
              playLevelUpSound();
              setRoundIndex((i) => {
                const prev = Math.max(i - 1, 0);
                setTimeLeft(tournament.rounds[prev].duration);
                return prev;
              });
            }}
          >
            Prev
          </Button>
          <Button
            type="secondary"
            onClick={() => {
              playLevelUpSound();
              setRoundIndex((i) => {
                const next = Math.min(i + 1, tournament.rounds.length - 1);
                setTimeLeft(tournament.rounds[next].duration);
                return next;
              });
            }}
          >
            Next
          </Button>
          <Button type="secondary" onClick={() => setBreakTime(b => !b)}>Break</Button>
          <h3>{round.sb}/{round.bb} • Ante {round.ante}</h3>
        </Card>

        {/* Prizes */}
        <Card>
          <Title>Tournament Settings</Title>
          <Subtitle>ชื่อทัวร์นาเมนต์</Subtitle>
          <Input value={tournament.name} onChange={(e) => setTournament(t => ({ ...t, name: e.target.value }))} />
          <Subtitle>Buy-In</Subtitle>
          <Input type="number" value={tournament.buyIn} onChange={(e) => setTournament(t => ({ ...t, buyIn: Number(e.target.value) }))} />
          <WrapperHeader>
            <Subtitle>Payout %</Subtitle>
            <Button type="primary" onClick={() => {
              setTournament((t) => ({
                ...t,
                payouts: [...t.payouts, 0],
              }));
            }}>
              + Add Payout
            </Button>
          </WrapperHeader>
          
          {tournament.payouts.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, margin: '8px 0 8px 0' }}>
              <span style={{ alignContent: 'center' }}>#{i + 1}</span>

              <Input
                type="number"
                value={p}
                onChange={(e: any) => {
                  const v = [...tournament.payouts];
                  v[i] = Number(e.target.value);
                  setTournament(t => ({ ...t, payouts: v }));
                }}
              />

              <Button
                type="primary"
                onClick={() => {
                  setTournament((t) => ({
                    ...t,
                    payouts: t.payouts.filter((_, idx) => idx !== i),
                  }));

                  // 🔥 sync winners
                  setPrizeWinners((prev) =>
                    prev.filter((_, idx) => idx !== i)
                  );
                }}
              >
                -
              </Button>
            </div>
          ))}
          <Subtitle>Hunter Bounty</Subtitle>
          <div style={{ display: 'flex' }}>
            <Input
              type='checkbox'
              checked={modeBounty}
              style={{ width: 20 }}
              onChange={(e) => setModeBounty(e.target.checked)}
            />
            <span>Enable Hunter Bounty</span>
          </div>
          {modeBounty && (
            <div style={{ marginTop: 10 }}>
              <Subtitle>Bounty Amount %</Subtitle>
              <Input
                type="number"
                value={bountyPercent}
                onChange={(e) => setBountyPercent(Number(e.target.value))}
              />
            </div>
          )}
        </Card>
      </Grid>
      <Grid2 style={{ marginTop: 20 }}>
        <Card>
          <WrapperHeader>
            <Subtitle>Player</Subtitle>
            <Button type="primary" onClick={addPlayer}>+ Add Player</Button>
          </WrapperHeader>
          
          <Table>
            <thead>
              <tr><th>ชื่อ</th><th>จำนวน Buy-in</th>{modeBounty && <th>Bounty</th>}<th></th></tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr
                  key={i}
                  onClick={() => selectPlayer(p)}
                  style={{
                    cursor: 'pointer',
                    background: isWinner(p.name) ? '#1e3a8a' : 'transparent',
                    color: isWinner(p.name) ? '#fff' : '#aaa',
                    transition: '0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isWinner(p.name)) e.currentTarget.style.background = '#222';
                  }}
                  onMouseLeave={(e) => {
                    if (!isWinner(p.name)) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td>
                    {(() => {
                      const pos = getPosition(p.name);
                      return (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                          {pos && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 12,
                                fontWeight: 'bold',
                                ...getBadgeStyle(pos),
                              }}
                            >
                              #{pos}
                            </span>
                          )}
                          <span>{p.name}</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ textAlign: 'center' }}>{p.count}</td>
                  {modeBounty && (
                    <td style={{ textAlign: 'center' }}>
                      <Input
                        type="number"
                        value={p.bounty || 0}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e: any) => {
                          const newPlayers = [...players];
                          newPlayers[i].bounty = Number(e.target.value);
                          setPlayers(newPlayers);
                        }}
                        style={{ width: 60 }}
                      />
                    </td>
                  )}
                  <td>
                    <Button
                      type="secondary"
                      onClick={(e) => {
                        e.stopPropagation(); // 🔥 กัน trigger select
                        const ok = window.confirm(`เพิ่ม Buy-in "${players[i].name}" ใช่ไหม?`);
                        if (!ok) return;
                        const newPlayers = [...players];
                        newPlayers[i].count += 1;
                        setPlayers(newPlayers);
                      }}
                    >
                      + Buy-in
                    </Button>
                    <Button
                      type="secondary"
                      onClick={(e) => {
                        e.stopPropagation(); // 🔥 กัน trigger select
                        const newPlayers = [...players];
                        newPlayers[i].count -= 1;
                        if (newPlayers[i].count <= 0) {
                          const ok = window.confirm(`ลบผู้เล่น "${players[i].name}" ใช่ไหม?`);
                          if (!ok) return;
                          setPlayers(players.filter((_, index) => index !== i));
                        } else {
                          const ok = window.confirm(`ลด Buy-in "${players[i].name}" ใช่ไหม?`);
                          if (!ok) return;
                          setPlayers(newPlayers);
                        }
                      }}
                    >
                      - Buy-in
                    </Button>

                    <Button
                      type="primary"
                      onClick={(e) => {
                        e.stopPropagation(); // 🔥 กัน trigger select
                        const ok = window.confirm(`ลบผู้เล่น "${players[i].name}" ใช่ไหม?`);
                        if (!ok) return;
                        setPlayers(players.filter((_, index) => index !== i));
                      }}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <Card>
          <Title>อันดับและเงินรางวัล</Title>
          <Subtitle>Prize Pool</Subtitle>
          {!modeBounty && <p>Total: {normalPrizePool}</p>}
          {modeBounty && <p>Total Prize Pool: {formatNumber(prizePool-bountyPool)}</p>}
          {modeBounty && (
            <>
              <p>Bounty Pool: {formatNumber(bountyPool)}</p>
              <p>ต่อหัว: {bountyPerHead.toFixed(2)}</p>
            </>
          )}
          <Table>
            <tbody>
              {prizes.map((a, i) => (
                <tr key={i}>
                  <td>
                    {i + 1 === 1 && "🏆 "}
                    {i + 1 === 2 && "🥈 "}
                    {i + 1 === 3 && "🥉 "}
                    {i + 1}
                  </td>
                  <td>{a}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <br />
          <Table>
            <thead>
              <tr>
                <th>อันดับ</th>
                <th>รางวัลอันดับ</th>
                {modeBounty && <th>รางวัลค่าหัว</th>}
                <th>Buy-in</th>
                <th>กำไร / ขาดทุน</th>
              </tr>
            </thead>
            <tbody>
              {allResults.map((w, i) => (
                <tr key={i}>
                  <td>
                    {i + 1 === 1 && "🏆 "}
                    {i + 1 === 2 && "🥈 "}
                    {i + 1 === 3 && "🥉 "}
                    {i + 1 > 3 && "🐷 "}
                    {i + 1} - {w.name}
                  </td>
                  <td style={{ textAlign: 'center' }}>{w.prize}</td>
                  {modeBounty && (
                    <td style={{ textAlign: 'center' }}>
                      {w.bounty.toFixed(2)}
                    </td>
                  )}
                  <td style={{ textAlign: 'center' }}>{w.count}</td>
                  <td style={{ 
                    textAlign: 'center',
                    color: w.profit >= 0 ? 'lime' : 'red'
                  }}>
                    {w.count} x {tournament.buyIn} = {formatNumber(w.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div style={{ marginTop: '10px', display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
            <Button
              type="success"
              disabled={players.length === 0}
              onClick={() => {
                const text = encodeURIComponent(generateSummaryText());
                window.open(`https://line.me/R/msg/text/?${text}`);
              }}
            >
              Share to LINE
            </Button>
            <Button
              type="info"
              disabled={players.length === 0}
              onClick={sendToTelegram}
            >
              Share to Telegram
            </Button>
            <Button
              type="discord"
              disabled={players.length === 0}
              onClick={sendToDiscord}
            >
              Share to Discord
            </Button>
          </div>
          
        </Card>
      </Grid2>
    </App>
  );
}

// Shared GitHub data fetch for the generators.
export async function fetchProfile(login, token, { latestFrom } = {}) {
  if (!token) throw new Error('GITHUB_TOKEN is required');
  const since = new Date(Date.now() - 365 * 864e5).toISOString();
  const gql = async (query, variables) => {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const { data, errors } = await res.json();
    if (errors) throw new Error(JSON.stringify(errors));
    return data;
  };
  const uid = await userId(login, token);
  const { user: u } = await gql(`query($login:String!,$since:GitTimestamp!){user(login:$login){
    id name createdAt
    contributionsCollection{contributionCalendar{totalContributions}}
    repositories(ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC,first:100){totalCount nodes{
      id name stargazerCount
      languages(first:5,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}
      defaultBranchRef{target{... on Commit{history(since:$since,first:100,author:{id:"__ID__"}){totalCount pageInfo{hasNextPage endCursor} nodes{committedDate messageHeadline}}}}}
    }}
  }}`.replace('__ID__', uid), { login, since });

  // Calendar can under-count (e.g. commits under a noreply email), so also count commits directly.
  let commits = 0;
  const dates = [];
  let latest = null;
  const langBytes = {};
  let stars = 0;
  const more = (r) => gql(`query($id:ID!,$since:GitTimestamp!,$after:String){node(id:$id){... on Repository{defaultBranchRef{target{... on Commit{history(since:$since,first:100,after:$after,author:{id:"${uid}"}){pageInfo{hasNextPage endCursor} nodes{committedDate messageHeadline}}}}}}}}`, r);
  for (const r of u.repositories.nodes) {
    stars += r.stargazerCount;
    // page through repos with more than 100 commits so counts and the weekly chart are complete
    let h0 = r.defaultBranchRef?.target?.history;
    while (h0?.pageInfo.hasNextPage) {
      const { node } = await more({ id: r.id, since, after: h0.pageInfo.endCursor });
      const next = node.defaultBranchRef.target.history;
      h0.nodes.push(...next.nodes);
      h0.pageInfo = next.pageInfo;
    }
    for (const e of r.languages.edges) if (e.node.name !== 'Jupyter Notebook') langBytes[e.node.name] = (langBytes[e.node.name] || 0) + e.size;
    const h = r.defaultBranchRef?.target?.history;
    if (h) {
      commits += h.totalCount;
      dates.push(...h.nodes.map(n => n.committedDate.slice(0, 10)));
      for (const n of h.nodes) if (!/^(chore|merge)/i.test(n.messageHeadline) && (!latestFrom || latestFrom.includes(r.name)) && (!latest || n.committedDate > latest.date)) latest = { date: n.committedDate, repo: r.name, msg: n.messageHeadline };
    }
  }
  const calendar = u.contributionsCollection.contributionCalendar.totalContributions;
  const days = new Set(dates);
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    if (days.has(d)) streak++;
    else if (i > 0) break;
  }
  const weekly = Array(52).fill(0);
  for (const d of dates) {
    const w = 51 - Math.floor((Date.now() - new Date(d).getTime()) / (7 * 864e5));
    if (w >= 0 && w < 52) weekly[w]++;
  }
  const avatar = await fetch(`https://github.com/${login}.png?size=240`).then(async r => `data:image/png;base64,${Buffer.from(await r.arrayBuffer()).toString('base64')}`);
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const total = Object.values(langBytes).reduce((a, b) => a + b, 0) || 1;
  return {
    login, weekly, avatar, latest, name: u.name || login, since: u.createdAt.slice(0, 4),
    repos: u.repositories.totalCount, stars, streak,
    contributions: Math.max(calendar, commits),
    commitsLast7: dates.filter(d => d >= weekAgo).length,
    langs: Object.entries(langBytes).sort((a, b) => b[1] - a[1]).slice(0, 4)
      .map(([n, b]) => [n, Math.round((b / total) * 100)]),
  };
}

async function userId(login, token) {
  const r = await fetch(`https://api.github.com/users/${login}`, { headers: { Authorization: `bearer ${token}` } });
  const j = await r.json();
  if (!j.node_id) throw new Error(`user lookup failed: ${JSON.stringify(j)}`);
  return j.node_id;
}

export const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Basic facts about a few repos, for the project cards.
export async function fetchRepos(login, names, token) {
  const q = `query($login:String!){user(login:$login){${names.map((n, i) => `r${i}:repository(name:"${n}"){name description stargazerCount pushedAt primaryLanguage{name color}}`).join(' ')}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q, variables: { login } }),
  });
  const { data, errors } = await res.json();
  if (errors) throw new Error(JSON.stringify(errors));
  return names.map((_, i) => data.user[`r${i}`]);
}

export const ago = iso => {
  const d = Math.max(0, Math.round((Date.now() - new Date(iso)) / 864e5));
  return d === 0 ? 'today' : d === 1 ? 'yesterday' : d < 60 ? `${d} days ago` : `${Math.round(d / 30)} months ago`;
};

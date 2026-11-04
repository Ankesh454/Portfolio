import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../portfolio.config.js';

const c = window.PORTFOLIO || {};
const safeUrl = (value, image = false) => {
  if (!value || typeof value !== 'string') return '';
  if (image && /^data:image\/(png|jpe?g|webp);base64,/i.test(value)) return value;
  try {
    const url = new URL(value, location.href);
    return ['http:', 'https:', 'mailto:', 'file:'].includes(url.protocol) ? value : '';
  } catch { return ''; }
};
const ExternalLink = ({ href, children, className = 'button glass' }) => {
  const url = safeUrl(href);
  return url ? <a className={className} href={url} target={/^https?:/.test(url) ? '_blank' : undefined} rel={/^https?:/.test(url) ? 'noopener noreferrer' : undefined}>{children}</a> : null;
};

function App() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  const [stage, setStage] = useState('opening');
  const [menuOpen, setMenuOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [introOpen, setIntroOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(reduced);
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [seen, setSeen] = useState([]);
  const introDialog = useRef(null);
  const projectDialog = useRef(null);
  const slides = [{ title: c.name, text: c.intro }, ...(c.projects || []).map(p => ({ title: p.title, text: `${p.category} · ${p.description}` })), { title: 'Let’s connect', text: `${c.role} · ${c.location}` }];
  const alternate = new URLSearchParams(location.search).get('portrait') === '2';
  const portrait = safeUrl(alternate ? c.alternatePortrait : c.portrait, true) || './assets/portrait.svg';
  const sections = [['about', 'The Pilot'], ['services', 'Services'], ['work', 'Projects'], ['journey', 'How I Work'], ['moments', 'Community'], ['contact', 'Connect']];

  useEffect(() => {
    document.title = `${c.name || 'Portfolio'} | Portfolio`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', c.intro || '');
    if (/^#[0-9a-f]{6}$/i.test(c.accent || '')) document.documentElement.style.setProperty('--accent', c.accent);
  }, []);

  useEffect(() => {
    if (stage === 'opening' || stage === 'profiles') document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    document.querySelectorAll('header,main,footer').forEach(el => { el.inert = stage !== 'home'; });
    return () => { document.body.style.overflow = ''; document.querySelectorAll('header,main,footer').forEach(el => { el.inert = false; }); };
  }, [stage]);

  useEffect(() => {
    const keydown = event => {
      if (stage === 'opening' && (event.key === 'Enter' || event.key === 'Escape')) { event.preventDefault(); setStage('profiles'); }
      else if (stage === 'profiles' && event.key === 'Escape') { setStage('home'); document.getElementById('play-intro')?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [stage]);

  useEffect(() => {
    if (!introOpen || paused || reduced) return undefined;
    const timer = window.setInterval(() => setSlide(i => (i + 1) % slides.length), 5000);
    return () => window.clearInterval(timer);
  }, [introOpen, paused, reduced, slides.length]);

  useEffect(() => {
    if (project) projectDialog.current?.showModal();
    else if (projectDialog.current?.open) projectDialog.current.close();
  }, [project]);
  useEffect(() => {
    if (introOpen) introDialog.current?.showModal();
    else if (introDialog.current?.open) introDialog.current.close();
  }, [introOpen]);

  useEffect(() => {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          setSeen(current => current.includes(entry.target.id) ? current : [...current, entry.target.id]);
        }
      }), { threshold: 0.12 });
      document.querySelectorAll('.chapter').forEach(el => { if (!reduced) el.classList.add('reveal-ready'); observer.observe(el); });
      return () => observer.disconnect();
    }
  }, [reduced]);

  useEffect(() => {
    if (!fine || reduced) return undefined;
    const cursor = document.getElementById('cursor');
    const move = event => {
      cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`;
      cursor.classList.toggle('active', Boolean(event.target.closest('button,a')));
      const hero = document.querySelector('.hero');
      const image = document.getElementById('hero-photo');
      if (hero?.contains(event.target)) {
        const x = event.clientX / innerWidth - 0.5, y = event.clientY / innerHeight - 0.5;
        image.style.transform = `perspective(1200px) rotateY(${x * 6}deg) rotateX(${-y * 4}deg) translateX(${x * 12}px)`;
      }
      const card = event.target.closest('.tilt');
      if (card) {
        const rect = card.getBoundingClientRect(), x = (event.clientX - rect.left) / rect.width - 0.5, y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1200px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg)`;
      }
    };
    const leave = event => { const card = event.target.closest?.('.tilt'); if (card) card.style.transform = ''; };
    document.addEventListener('pointermove', move); document.addEventListener('pointerout', leave);
    return () => { document.removeEventListener('pointermove', move); document.removeEventListener('pointerout', leave); };
  }, [fine, reduced]);

  const startIntro = () => { setSlide(0); setPaused(reduced); setIntroOpen(true); };
  const closeProject = () => setProject(null);
  const closeIntro = () => setIntroOpen(false);
  const goHome = target => { setStage('home'); requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' })); };
  const moveSlide = delta => setSlide(index => (index + delta + slides.length) % slides.length);

  return <>
    <a className="skip" href="#main">Skip to content</a><div id="cursor" aria-hidden="true" />
    <div id="opening" role="dialog" aria-label="Opening titles" hidden={stage !== 'opening'}>
      <button className="skip-intro" onClick={() => setStage('profiles')}>Skip intro</button><div className="studio">A PERSONAL PORTFOLIO</div>
      <div className="opening-title"><h1>{c.firstName || c.name}</h1><p>THE A PORTFOLIO</p></div><img src={portrait} alt={`Portrait of ${c.name}`} />
      <button className="play-start primary" onClick={() => setStage('profiles')}>▶ PLAY</button>
    </div>
    <div id="profiles" role="dialog" aria-label="Choose your view" hidden={stage !== 'profiles'}>
      <h2>What brings you here?</h2><p>Choose a starting point. Explore the whole portfolio any time.</p>
      <div className="profile-grid">{[['main','▶','Explore Everything','top'],['recruiter','R','View My Profile','profile'],['developer','⌘','Explore My Work','work'],['creative','✦','Build With Me','services']].map(([key,icon,label,target]) => <button key={key} onClick={() => goHome(target)}><span>{icon}</span><b>{label}</b></button>)}</div>
    </div>
    <header><a href="#top" className="logo"><b>▶</b> PORTFOLIO</a><nav className={menuOpen ? 'open' : ''} aria-label="Sections">{[['work','Work'],['skills-section','Expertise'],['about','About'],['contact','Contact']].map(([id,label]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav><button id="menu-toggle" type="button" aria-expanded={menuOpen} aria-label="Toggle navigation" onClick={() => setMenuOpen(v => !v)}>☰</button></header>
    <main id="main">
      <section className="hero" id="top"><div className="atmosphere" aria-hidden="true"/><div className="hero-art"><img id="hero-photo" src={portrait} alt={`Portrait of ${c.name}`} /></div><div className="hero-copy"><span className="eyebrow">A PERSONAL PORTFOLIO</span><h1>{c.firstName || c.name}</h1><div className="series-label">THE H PORTFOLIO</div><div className="meta"><span>{c.role}</span><span>{c.location}</span></div><p>{c.intro}</p><div className="actions"><button className="primary" onClick={startIntro}>▶ Play Intro</button><a className="button glass" href="#work">＋ My Work</a></div></div><div className="floating-chip"><span>NOW STREAMING</span><b>{c.role}</b></div></section>
      <div className="continue gutter"><span className="eyebrow">CONTINUE EXPLORING</span><div id="chapter-links">{sections.filter(([id]) => id !== 'moments' || c.milestones?.length || c.credentials?.length).map(([id,label],i) => <a key={id} href={`#${id}`} data-section={id} className={seen.includes(id) ? 'seen' : ''}><span>EPISODE {String(i+1).padStart(2,'0')}</span><b>{label}</b></a>)}</div></div>
      <div id="sections">
        <section id="about" className="gutter chapter"><div className="section-label">BACKGROUND</div><h2>About Me</h2><div className="about-grid"><div className="portrait-frame tilt"><img src={portrait} alt={`Portrait of ${c.name}`} /></div><div><p className="story-copy">{c.about}</p><div className="chips">{(c.skills || []).map(s => <span key={s}>{s}</span>)}</div>{safeUrl(c.resume) && <ExternalLink href={c.resume}>View Resume ↗</ExternalLink>}</div></div></section>
        <section id="services" className="gutter chapter"><div className="section-label">LET'S BUILD</div><h2>What I Can Do</h2><div id="service-grid" className="service-grid">{(c.services || []).map((s,i) => <article className="service-card tilt" key={s.title}><span className="number">{String(i+1).padStart(2,'0')}</span><h3>{s.title}</h3><p>{s.detail}</p></article>)}</div></section>
        <section id="work" className="chapter"><div className="gutter"><div className="section-label">SELECTED WORK</div><h2>Projects</h2><p className="hint">Explore any project to view its architecture, features, and source repository.</p></div><div className="rail-controls gutter"><button aria-label="Scroll projects left" onClick={() => document.getElementById('project-rail').scrollBy({left:-document.getElementById('project-rail').clientWidth*.75,behavior:reduced?'instant':'smooth'})}>←</button><button aria-label="Scroll projects right" onClick={() => document.getElementById('project-rail').scrollBy({left:document.getElementById('project-rail').clientWidth*.75,behavior:reduced?'instant':'smooth'})}>→</button></div><div id="project-rail" className="project-rail gutter">{(c.projects || []).map(p => <button key={p.title} type="button" aria-label={`Open ${p.title}`} className="project-card tilt" style={{'--card-accent':/^#[0-9a-f]{6}$/i.test(p.accent || '') ? p.accent : '#ed2444'}} onClick={() => setProject(p)}><span>{p.category}</span><h3>{p.title}</h3><p>{p.description}</p><small>▶ Explore project</small></button>)}</div></section>
        <section id="skills-section" className="gutter chapter"><div className="section-label">TECHNICAL CAPABILITIES</div><h2>Skills &amp; Toolkit</h2><div id="toolkit-grid" className="service-grid">{(c.skills || []).map(skill => <article className="service-card" key={skill}><span className="eyebrow">TECHNICAL TOOLKIT</span><h3>{skill}</h3></article>)}</div></section>
        <section id="profile" className="gutter chapter"><div className="section-label">PROFILE &amp; EXPERIENCE</div><h2>The Full Story</h2><div className="resume-grid"><article className="resume-sheet"><h3>{c.name}</h3><div className="resume-columns"><div><h4>Education</h4>{(c.education || []).length ? c.education.map(e => <article key={e.school}><h5>{e.school}</h5><p>{[e.degree,e.period].filter(Boolean).join(' · ')}</p></article>) : <p>Add your school, college or university in the customizer.</p>}<h4>Projects</h4>{(c.projects || []).map(p => <article key={p.title}><h5>{p.title}</h5><p>{(p.stack || []).join(', ')}</p></article>)}</div><div><h4>Skills</h4><div className="resume-skill-list">{(c.skills || []).map(s => <span key={s}>{s}</span>)}</div></div></div></article><aside className="product-statement"><span className="eyebrow">IDEA → ARCHITECTURE → DEPLOYMENT</span><h3>More than code.</h3><p>Software engineered to solve real-world problems through intelligent systems and clean design.</p><a className="button glass" href="#contact">Get in touch ↗</a></aside></div></section>
        <section id="journey" className="gutter chapter"><div className="section-label">DEVELOPMENT APPROACH</div><h2>How I Work</h2><div id="journey-tabs" role="tablist" aria-label="Journey seasons">{(c.journey || []).map((s,i) => <button key={s.title} id={`season-${i}`} type="button" role="tab" aria-controls="journey-panel" aria-selected={seasonIndex===i} tabIndex={seasonIndex===i ? 0 : -1} onClick={() => setSeasonIndex(i)} onKeyDown={e => { if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=(i+(e.key==='ArrowRight'?1:-1)+(c.journey||[]).length)%(c.journey||[]).length;setSeasonIndex(next);document.getElementById(`season-${next}`)?.focus();} }}>{`S${String(i+1).padStart(2,'0')} · ${s.title}`}</button>)}</div><article id="journey-panel" role="tabpanel" aria-labelledby={`season-${seasonIndex}`}>
          {c.journey?.[seasonIndex] && <><span className="eyebrow">{c.journey[seasonIndex].period}</span><h3>{c.journey[seasonIndex].title}</h3><p>{c.journey[seasonIndex].detail}</p></>}
        </article></section>
        {!!(c.milestones?.length || c.credentials?.length) && <section id="moments" className="gutter chapter"><div className="section-label">THE HIGHLIGHTS</div><h2>Leadership &amp; Community</h2><div className="service-grid">{(c.milestones || []).map(m => <article className="service-card" key={m.title}><span className="eyebrow">{m.organization}</span><h3>{m.title}</h3><p>{m.detail}</p></article>)}</div><div className="chips">{(c.credentials || []).map(m => <ExternalLink key={m.title} href={m.url} className="">{m.title} ↗</ExternalLink>)}</div></section>}
      </div>
      <section id="contact" className="gutter chapter contact"><span className="eyebrow">HAVE A PROJECT IN MIND?</span><h2>LET’S<br/>BUILD IT.</h2><p>{c.name} · {c.role}</p><div className="actions">{[['WhatsApp',c.links?.whatsapp],['Email',c.email ? `mailto:${c.email}` : ''],['Instagram',c.links?.instagram],['LinkedIn',c.links?.linkedin],['GitHub',c.links?.github]].filter(([,url]) => safeUrl(url)).map(([name,url]) => <ExternalLink key={name} href={url}>{name} ↗</ExternalLink>)}</div><div className="actions"><button className="secondary" onClick={() => setStage('opening')}>Replay opening ↺</button></div></section>
    </main>
    <footer className="gutter"><span>© {new Date().getFullYear()} {c.name}</span><span></span></footer>
    <dialog ref={projectDialog} id="project-dialog" onClose={closeProject} onClick={e => { if(e.target===e.currentTarget) closeProject(); }}><button type="button" className="close" aria-label="Close project" onClick={closeProject}>×</button>{project && <><div className="section-label">{project.category}</div><h2>{project.title}</h2><p>{project.description}</p><div className="chips">{(project.stack || []).map(s => <span key={s}>{s}</span>)}</div><ul>{(project.features || []).map(f => <li key={f}>{f}</li>)}</ul><div className="actions"><ExternalLink href={project.demo} className="button primary">Launch Demo ↗</ExternalLink><ExternalLink href={project.github}>Source ↗</ExternalLink></div></>}</dialog>
    <dialog ref={introDialog} id="intro-dialog" onClose={closeIntro} onKeyDown={e => { if(e.key==='ArrowRight'){moveSlide(1);e.preventDefault()} if(e.key==='ArrowLeft'){moveSlide(-1);e.preventDefault()} if(e.code==='Space'&&e.target.tagName!=='BUTTON'){setPaused(v=>!v);e.preventDefault()} }} onClick={e => { if(e.target===e.currentTarget) closeIntro(); }}><button type="button" className="close" aria-label="Close intro" onClick={closeIntro}>×</button><span className="eyebrow">THE HIGHLIGHT REEL</span><div id="slide-count">{String(slide+1).padStart(2,'0')} / {String(slides.length).padStart(2,'0')}</div><h2>{slides[slide]?.title}</h2><p>{slides[slide]?.text}</p><div className="actions"><button aria-label="Previous slide" onClick={() => moveSlide(-1)}>←</button><button onClick={() => setPaused(v => !v)}>{paused ? 'Play' : 'Pause'}</button><button aria-label="Next slide" onClick={() => moveSlide(1)}>→</button></div></dialog>
    <noscript>This portfolio needs JavaScript. Enable it to explore the content.</noscript>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);

'use client';
import { useEffect, useRef, useState } from 'react';
import MovieSearch from './movie-search';
import AdminLogin from './admin-login';
import Orders from './orders';
import { ArrowUpRight, Frame, ImagePlus, X, Check, SlidersHorizontal, Search } from 'lucide-react';
import { categories, initialSettings, money, Product, Settings } from '../lib/catalog';
export default function Gallery() {
  const [products, setProducts] = useState<Product[]>([]),
    [settings, setSettings] = useState(initialSettings),
    [admin, setAdmin] = useState(false),
    [manage, setManage] = useState(false),
    [category, setCategory] = useState('Todos'),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState<Product | null>(null),
    [custom, setCustom] = useState(false),
    [photo, setPhoto] = useState(''),
    [quantity, setQuantity] = useState(1),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [editing, setEditing] = useState<Product | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  const [adminTab, setAdminTab] = useState('catalog'),
    [customerName, setCustomerName] = useState(''),
    [contact, setContact] = useState(''),
    [photoFile, setPhotoFile] = useState<File | null>(null),
    [orderId, setOrderId] = useState(''),
    [orderError, setOrderError] = useState('');
  async function submitOrder(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setOrderError('');
    try {
      const form = new FormData();
      form.set('productId', custom ? 'custom' : selected!.id);
      form.set('variant', 'frame');
      form.set('quantity', String(quantity));
      form.set('name', customerName);
      form.set('contact', contact);
      form.set('notes', '');
      if (selected?.tmdb) form.set('tmdb', JSON.stringify(selected.tmdb));
      if (custom && photoFile) form.set('photo', photoFile);
      const r = await fetch('/api/orders', { method: 'POST', body: form });
      const d = (await r.json()) as { id: string; error?: string };
      if (!r.ok) throw Error(d.error);
      setOrderId(d.id);
    } catch (e) {
      setOrderError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const [login, setLogin] = useState(false),
    [orderingEnabled, setOrderingEnabled] = useState(false),
    [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/catalog');
      if (!r.ok) throw Error('Não foi possível carregar o catálogo.');
      const d = (await r.json()) as {
        products: Product[];
        settings: Settings;
        admin: boolean;
        orderingEnabled: boolean;
      };
      setProducts(d.products);
      setSettings(d.settings);
      setAdmin(d.admin);
      setOrderingEnabled(d.orderingEnabled);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (selected || custom) {
      setQuantity(1);
      setOrderId('');
      setOrderError('');
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [selected, custom]);
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo);
    },
    [photo],
  );
  function close() {
    setSelected(null);
    setCustom(false);
  }
  function photoInput(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3500000) {
      setNotice('Escolha JPG, PNG ou WebP de até 3,5 MB.');
      return;
    }
    setPhotoFile(file);
    setPhoto(URL.createObjectURL(file));
    setNotice('');
  }
  const price = custom ? settings.framePrice : (selected?.framePrice ?? null);

  async function save(type: string, data: Product | Settings) {
    setBusy(true);
    setNotice('');
    try {
      const r = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data }),
      });
      const d = (await r.json()) as { error?: string };
      if (!r.ok) throw Error(d.error);
      await load();
      setEditing(null);
      setNotice('Alterações salvas.');
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file || !editing) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await fetch('/api/images', { method: 'POST', body: form });
      if (!r.ok) throw Error(await r.text());
      const d = (await r.json()) as { url: string };
      setEditing({ ...editing, image: d.url, demo: false });
      setNotice('Imagem enviada. Salve o modelo para publicá-lo no catálogo.');
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const shown = products.filter(
    (p) =>
      p.active &&
      (category === 'Todos' || p.category === category) &&
      p.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="topline">
        PROJETO DE PORTFÓLIO · SEM VENDAS REAIS <span>Explore a Enquadraria ↗</span>
      </div>
      <header className="store-header">
        <div className="store-header-top">
          <button
            className="menu-toggle"
            aria-label="Abrir categorias"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
          <a href="#" className="store-logo">
            enquadraria<span>ARTE PRA CHAMAR DE SUA.</span>
          </a>
          <div className="header-tools">
            <a href="#buscar" aria-label="Buscar filmes e séries">
              <Search size={24} />
            </a>
            <button
              aria-label="Administração"
              onClick={() => (admin ? setManage(!manage) : setLogin(true))}
            >
              <SlidersHorizontal size={23} />
            </button>
          </div>
        </div>
        <nav className={'store-nav ' + (menuOpen ? 'open' : '')} aria-label="Navegação principal">
          <a
            href="#colecao"
            onClick={() => {
              setCategory('Todos');
              setMenuOpen(false);
            }}
          >
            TODOS
          </a>
          {categories.map((c) => (
            <a
              key={c}
              href="#colecao"
              onClick={() => {
                setCategory(c);
                setMenuOpen(false);
              }}
            >
              {c.toUpperCase()}
            </a>
          ))}
          <span />
          <a href="#personalize">SUA FOTO</a>
          <a href="#como">COMO PEDIR</a>
        </nav>
      </header>
      <main>
        <section className="campaign">
          <div className="campaign-copy">
            <p className="campaign-kicker">ENQUADRE O QUE VOCÊ AMA.</p>
            <h1>
              MAIS ARTE.
              <br />
              MAIS VOCÊ.
            </h1>
            <p>
              Seu filme, seu som, sua memória.
              <br />
              Um universo inteiro cabe na sua parede.
            </p>
            <a href="#colecao" className="button campaign-button">
              ENCONTRE SEU QUADRO <ArrowUpRight size={20} />
            </a>
          </div>
          <div className="campaign-stage">
            <span className="campaign-star">✳</span>
            <div className="campaign-orbit" />
            <div className="campaign-frame cf-one">
              <img src="/art/ritmo.svg" alt="Arte No seu ritmo" />
            </div>
            <div className="campaign-frame cf-two">
              <img src="/art/orbita.svg" alt="Arte Além da órbita" />
            </div>
            <div className="campaign-frame cf-three">
              <img src="/art/sol.svg" alt="Arte O caminho do sol" />
            </div>
            <span className="campaign-sticker">
              SEU CANTO.
              <br />
              SEU MUNDO.
            </span>
          </div>
          <div className="campaign-bottom">
            <span>QUADROS & PÔSTERES A3</span>
            <a href="#personalize">OU USE A SUA FOTO ↗</a>
          </div>
        </section>
        <section className="category-shortcuts" aria-label="Explore por categoria">
          {[...categories, 'Sua foto'].map((c, i) => (
            <button
              key={c}
              onClick={() => {
                if (c === 'Sua foto') {
                  setCustom(true);
                } else {
                  setCategory(c);
                  document.getElementById('colecao')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <span className={'category-picture cat-' + i}>
                {c === 'Sua foto' ? (
                  <ImagePlus size={42} />
                ) : (
                  <img
                    src={'/art/' + ['cinema', 'episodio', 'sol', 'ritmo', 'fe'][i] + '.svg'}
                    alt=""
                  />
                )}
              </span>
              <strong>{c.toUpperCase()}</strong>
            </button>
          ))}
        </section>
        <MovieSearch
          onSelect={(p) => {
            setCustom(false);
            setSelected(p);
          }}
        />
        <section id="colecao" className="collection">
          <div className="section-top">
            <div>
              <p className="eyebrow">UM POUCO DO NOSSO UNIVERSO</p>
              <h2>ESCOLHAS DA GALERIA.</h2>
            </div>
            <span className="count">A3 · 29,7 × 42 cm</span>
          </div>
          <div className="filters">
            <div className="tabs" aria-label="Categorias">
              {['Todos', ...categories].map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  className={category === c ? 'active' : ''}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className="search">
              <Search size={17} />
              <input
                aria-label="Buscar quadro"
                placeholder="Encontre sua história"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>
          {loading ? (
            <p role="status" className="empty">
              Preparando a galeria…
            </p>
          ) : error ? (
            <div className="empty" role="alert">
              {error} <button onClick={load}>Tentar novamente</button>
            </div>
          ) : (
            <>
              <div className="grid">
                {shown.map((p, i) => (
                  <button key={p.id} className="product" onClick={() => setSelected(p)}>
                    <div className={'product-scene scene-' + (i % 4)}>
                      <div className="product-frame">
                        <img src={p.image} alt={p.title} loading="lazy" />
                      </div>
                      <span className="view">
                        Ver quadro <ArrowUpRight size={16} />
                      </span>
                      {p.demo && <span className="demo-tag">Exemplo ilustrativo</span>}
                    </div>
                    <div className="product-meta">
                      <span>{p.category}</span>
                      <span>A3</span>
                    </div>
                    <div className="product-title">
                      <h3>{p.title}</h3>
                      <ArrowUpRight size={19} />
                    </div>
                    <p>
                      {p.framePrice === null
                        ? 'Preço sob consulta'
                        : money(p.framePrice) + ' com moldura'}
                    </p>
                  </button>
                ))}
              </div>
              {shown.length === 0 && (
                <div className="empty">
                  Nenhum quadro por aqui ainda.{' '}
                  <button
                    onClick={() => {
                      setCategory('Todos');
                      setQuery('');
                    }}
                  >
                    Ver toda a coleção
                  </button>
                </div>
              )}
              <p className="collection-note">
                As artes iniciais são exemplos para visualizar a loja. Acabamento e disponibilidade
                são confirmados no atendimento.
              </p>
            </>
          )}
        </section>
        <section id="personalize" className="personalize">
          <div className="photo-scene">
            <div className="photo-frame">
              <svg
                viewBox="0 0 300 400"
                role="img"
                aria-label="Ilustração de uma paisagem emoldurada"
              >
                <defs>
                  <linearGradient id="sky" x2="0" y2="1">
                    <stop stopColor="#c4d1d3" />
                    <stop offset="1" stopColor="#eee0ca" />
                  </linearGradient>
                </defs>
                <path fill="url(#sky)" d="M0 0h300v400H0z" />
                <circle cx="205" cy="105" r="35" fill="#fff4cc" />
                <path d="M0 240 100 160 210 290 300 205V400H0" fill="#839387" />
                <path d="M0 310 110 245 200 330 300 280V400H0" fill="#485b4d" />
              </svg>
            </div>
            <span className="floating-note">O melhor lugar para suas memórias.</span>
          </div>
          <div className="personal-copy">
            <p className="eyebrow">SEU CLIQUE. SEU QUADRO.</p>
            <h2>
              Tem histórias que
              <br />
              só você pode contar.
            </h2>
            <p>
              A viagem favorita, seu pet, alguém especial. Escolha uma foto e veja como ela fica em
              um quadro e envie seu pedido por aqui.
            </p>
            <button className="button dark" onClick={() => setCustom(true)}>
              <ImagePlus size={19} /> Escolher minha foto
            </button>
            <small>Sua foto será enviada com o pedido e ficará restrita ao atendimento.</small>
          </div>
        </section>
        <section id="como" className="how">
          <div>
            <p className="eyebrow">SEM COMPLICAÇÃO</p>
            <h2>
              Da sua escolha
              <br />
              para a sua parede.
            </h2>
          </div>
          {[
            [
              '01',
              'Encontre a sua arte',
              'Escolha na galeria ou use uma foto que tenha significado para você.',
            ],
            [
              '02',
              'Monte seu pedido',
              'Selecione pôster ou quadro completo e confira os detalhes.',
            ],
            [
              '03',
              'Experimente o fluxo',
              'Envie um pedido de teste e conheça o fluxo. Este projeto não realiza vendas.',
            ],
          ].map(([n, t, d]) => (
            <div className="step" key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </section>
      </main>
      <footer>
        <a className="brand" href="#">
          <Frame size={24} />
          {settings.name}
        </a>
        <p>Histórias que merecem sair da tela.</p>
        {admin ? (
          <button
            className="text-button"
            onClick={() => {
              setManage(!manage);
              setTimeout(
                () => document.getElementById('admin')?.scrollIntoView({ behavior: 'smooth' }),
                50,
              );
            }}
          >
            <SlidersHorizontal size={15} /> Administrar loja
          </button>
        ) : (
          <button className="text-button" onClick={() => setLogin(true)}>
            Acesso administrador
          </button>
        )}
      </footer>
      <div aria-live="polite" className={notice ? 'notice' : ''}>
        {notice && (
          <>
            <span>{notice}</span>
            <button aria-label="Fechar aviso" onClick={() => setNotice('')}>
              <X size={16} />
            </button>
          </>
        )}
      </div>
      {manage && admin && (
        <section className="admin" id="admin">
          <div className="section-top">
            <div>
              <p className="eyebrow">ACESSO RESTRITO</p>
              <h2>Seu catálogo, do seu jeito.</h2>
            </div>
            <button onClick={() => setManage(false)}>Fechar painel</button>
          </div>
          <div className="tabs admin-tabs">
            <button
              className={adminTab === 'catalog' ? 'active' : ''}
              onClick={() => setAdminTab('catalog')}
            >
              Catálogo e configurações
            </button>
            <button
              className={adminTab === 'orders' ? 'active' : ''}
              onClick={() => setAdminTab('orders')}
            >
              Pedidos recebidos
            </button>
          </div>
          {adminTab === 'orders' ? (
            <Orders />
          ) : (
            <>
              <form
                className="admin-settings"
                onSubmit={(e) => {
                  e.preventDefault();
                  save('settings', settings);
                }}
              >
                <label>
                  Nome da loja
                  <input
                    required
                    maxLength={60}
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  />
                </label>
                {(['posterPrice', 'framePrice'] as const).map((k) => (
                  <label key={k}>
                    Foto personalizada · {k === 'posterPrice' ? 'pôster' : 'quadro'} (R$)
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={settings[k] ?? ''}
                      placeholder="Sob consulta"
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          [k]: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </label>
                ))}
                <button disabled={busy} className="button dark">
                  Salvar configurações
                </button>
              </form>
              <div className="section-top">
                <h3>Modelos cadastrados</h3>
                <button
                  className="button dark"
                  onClick={() =>
                    setEditing({
                      id: crypto.randomUUID(),
                      title: '',
                      category: 'Filmes',
                      image: '',
                      description: '',
                      posterPrice: null,
                      framePrice: null,
                      active: true,
                      demo: false,
                    })
                  }
                >
                  + Adicionar modelo
                </button>
              </div>
              <div className="admin-list">
                {products.map((p) => (
                  <button key={p.id} onClick={() => setEditing(p)}>
                    <img src={p.image} alt="" />
                    <span>
                      {p.title}
                      <small>
                        {p.category} · {p.active ? 'Visível' : 'Oculto'}
                      </small>
                    </span>
                    <span>Editar ↗</span>
                  </button>
                ))}
              </div>
              {editing && (
                <form
                  className="edit-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editing.image) {
                      setNotice('Envie uma imagem antes de salvar.');
                      return;
                    }
                    save('product', editing);
                  }}
                >
                  <h3>{editing.title || 'Novo modelo'}</h3>
                  <label>
                    Imagem (JPG, PNG ou WebP, até 3,5 MB)
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => upload(e.target.files?.[0])}
                    />
                  </label>
                  {editing.image && (
                    <img className="edit-preview" src={editing.image} alt="Prévia do modelo" />
                  )}
                  <label>
                    Nome
                    <input
                      required
                      maxLength={100}
                      value={editing.title}
                      onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    />
                  </label>
                  <label>
                    Categoria
                    <select
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Características e acabamento
                    <textarea
                      maxLength={1000}
                      value={editing.description}
                      onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    />
                  </label>
                  {(['posterPrice', 'framePrice'] as const).map((k) => (
                    <label key={k}>
                      Preço de venda · {k === 'posterPrice' ? 'pôster' : 'quadro completo'} (R$)
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Sob consulta"
                        value={editing[k] ?? ''}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            [k]: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </label>
                  ))}
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                    />{' '}
                    Mostrar na galeria
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={editing.demo}
                      onChange={(e) => setEditing({ ...editing, demo: e.target.checked })}
                    />{' '}
                    Identificar como exemplo ilustrativo
                  </label>
                  <div className="hero-actions">
                    <button className="button dark" disabled={busy}>
                      {busy ? 'Salvando…' : 'Salvar modelo'}
                    </button>
                    <button type="button" onClick={() => setEditing(null)}>
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </section>
      )}
      {login && (
        <AdminLogin
          onClose={() => setLogin(false)}
          onSuccess={() => {
            setLogin(false);
            load();
            setManage(true);
          }}
        />
      )}
      <dialog
        ref={dialog}
        onCancel={close}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        <button className="close" onClick={close} aria-label="Fechar detalhes">
          <X />
        </button>
        <div className="detail">
          <div className="detail-scene">
            <div className="detail-frame">
              {custom ? (
                photo ? (
                  <img src={photo} alt="Prévia da sua foto" />
                ) : (
                  <div className="placeholder">
                    <ImagePlus size={45} />
                    <p>
                      Sua história
                      <br />
                      começa com uma foto.
                    </p>
                  </div>
                )
              ) : (
                <img src={selected?.image} alt={selected?.title} />
              )}
            </div>
            <small>Prévia ilustrativa • imagem inteira preservada</small>
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{custom ? 'FEITO COM A SUA FOTO' : selected?.category}</p>
            <h2>{custom ? 'Uma memória para emoldurar.' : selected?.title}</h2>
            <p>
              {custom
                ? 'Escolha sua foto para visualizar a composição. O enquadramento final será combinado no atendimento.'
                : selected?.description}
            </p>
            {selected?.demo && (
              <p className="demo-info">Arte ilustrativa para demonstração da loja.</p>
            )}
            {custom && (
              <label className="upload">
                <ImagePlus size={18} />
                {photo ? 'Trocar minha foto' : 'Selecionar minha foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => photoInput(e.target.files?.[0])}
                />
              </label>
            )}
            <ul className="specs">
              <li>
                <span>Tamanho</span>
                <strong>A3 · 29,7 × 42 cm</strong>
              </li>
              <li>
                <span>Impressão</span>
                <strong>Papel couché 250 g/m²</strong>
              </li>
              <li>
                <span>Moldura</span>
                <strong>Preta com vidro</strong>
              </li>
              <li>
                <label htmlFor="qty">Quantidade</label>
                <input
                  id="qty"
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))
                  }
                />
              </li>
            </ul>
            <div className="price">
              {price === null ? 'Preço sob consulta' : money(price * quantity)}
              <small>
                {price === null
                  ? 'Confirmaremos o valor no atendimento.'
                  : 'Total dos itens · entrega a combinar'}
              </small>
            </div>
            {orderId ? (
              <div className="order-success" role="status">
                <Check size={30} />
                <h3>Pedido de demonstração recebido!</h3>
                <p>
                  Seu número é <strong>{orderId.slice(0, 8).toUpperCase()}</strong>.
                </p>
                <p>
                  Você informou o contato <strong>{contact}</strong> nesta simulação. Nenhum produto
                  será vendido ou entregue.
                </p>
                <button className="button dark" onClick={close}>
                  Continuar explorando
                </button>
              </div>
            ) : (
              <form className="order-form" onSubmit={submitOrder}>
                <label>
                  Seu nome
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label>
                  Telefone ou e-mail para retorno
                  <input
                    required
                    minLength={6}
                    maxLength={150}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    autoComplete="email"
                    placeholder="Como podemos falar com você?"
                  />
                </label>
                {!orderingEnabled && (
                  <p className="order-note">
                    A loja está em preparação. O envio será liberado após configurar o atendimento.
                  </p>
                )}
                <p className="order-note">
                  Usaremos seu nome, contato e foto apenas para atender este pedido. Ao enviar, você
                  concorda com esse uso. Este é um projeto de portfólio: não há cobrança, produção
                  ou entrega.
                </p>
                {orderError && (
                  <p role="alert" className="form-error">
                    {orderError}
                  </p>
                )}
                <button
                  className="button dark"
                  disabled={busy || !orderingEnabled || (custom && !photoFile)}
                >
                  {busy ? 'Enviando pedido…' : 'Enviar Pedido'}
                </button>
              </form>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}

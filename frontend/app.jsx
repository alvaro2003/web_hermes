import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function daysUntilExpiry(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr + 'T00:00:00');
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

function Header({ page, setPage }) {
  return (
    <header className="header">
      <div className="header__logo">
        <span>Hermes </span>B2B
      </div>
      <nav className="header__nav">
        <button
          className={`nav-btn ${page === 'estoque' ? 'active' : ''}`}
          onClick={() => setPage('estoque')}
        >
          ➤ Estoque
        </button>
        <button
          className={`nav-btn ${page === 'gerenciar' ? 'active' : ''}`}
          onClick={() => setPage('gerenciar')}
        >
          ➤ Gerenciar
        </button>
      </nav>
    </header>
  );
}

function ProductCard({ produto }) {
  const days = daysUntilExpiry(produto.data_validade);
  const expiryClass = days <= 7 ? 'expiry-warn' : 'expiry-ok';

  return (
    <article className="product-card">
      <div className="product-card__header">
        <div>
          <div className="product-card__id">ID #{produto.id}</div>
          <div className="product-card__name">{produto.nome}</div>
        </div>
        <div className="product-card__qty">{produto.quantidade} un.</div>
      </div>
      <div className="product-card__body">
        <div className="product-card__field">
          <span className="product-card__label">Validade</span>
          <span className={`product-card__value ${expiryClass}`}>
            {formatDate(produto.data_validade)}
            {days <= 7 && days >= 0 && ' ⚠️'}
            {days < 0 && ' ❌ Vencido'}
          </span>
        </div>
        <div className="product-card__field">
          <span className="product-card__label">Entrada</span>
          <span className="product-card__value">{formatDate(produto.data_entrada)}</span>
        </div>
        <div className="product-card__field">
          <span className="product-card__label">Localização</span>
          <span className="product-card__value">{produto.localizacao}</span>
        </div>
      </div>
    </article>
  );
}

function EstoquePage({ produtos, loading, online }) {
  return (
    <main className="page">
      <h1 className="page-title">
        Visão de <span>Anúncios</span>
      </h1>
      <p className="page-subtitle">-tudo que você pode querer.</p>

      <div className="status-bar">
        <div className={`status-dot ${online ? '' : 'offline'}`} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--muted)' }}>
          {online ? 'Banco de dados conectado' : 'Sem conexão com o servidor'}
        </span>
        <span className="status-count">
          Total: <strong>{produtos.length}</strong>
        </span>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner" />
          CARREGANDO PRODUTOS...
        </div>
      ) : produtos.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">Nenhum anúncio cadastrado!</p>
          <p className="empty-state__text" style={{ marginTop: '0.5rem' }}>
            Acesse Gerenciar para adicionar um anúncio.
          </p>
        </div>
      ) : (
        <div className="products-grid">
          {produtos.map((p) => (
            <ProductCard key={p.id} produto={p} />
          ))}
        </div>
      )}
    </main>
  );
}

function GerenciarPage({ onRefresh }) {
  const today = new Date().toISOString().split('T')[0];

  const [addForm, setAddForm] = useState({
    nome: '',
    quantidade: '',
    data_validade: '',
    data_entrada: today,
    localizacao: '',
  });
  const [addStatus, setAddStatus] = useState(null);
  const [addLoading, setAddLoading] = useState(false);

  const [removeId, setRemoveId] = useState('');
  const [removeStatus, setRemoveStatus] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const handleAddChange = (e) => {
    setAddForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdd = async () => {
    setAddLoading(true);
    setAddStatus(null);
    try {
      const res = await fetch(`${API}/produtos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          quantidade: parseInt(addForm.quantidade, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar.');
      setAddStatus({ type: 'success', msg: `✅ Produto "${data.nome}" adicionado com ID #${data.id}` });
      setAddForm({ nome: '', quantidade: '', data_validade: '', data_entrada: today, localizacao: '' });
      onRefresh();
    } catch (err) {
      setAddStatus({ type: 'error', msg: `❌ ${err.message}` });
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!removeId) return;
    setRemoveLoading(true);
    setRemoveStatus(null);
    try {
      const res = await fetch(`${API}/produtos/${removeId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover.');
      setRemoveStatus({ type: 'success', msg: `✅ ${data.message}` });
      setRemoveId('');
      onRefresh();
    } catch (err) {
      setRemoveStatus({ type: 'error', msg: `❌ ${err.message}` });
    } finally {
      setRemoveLoading(false);
    }
  };

  const addValid =
    addForm.nome &&
    addForm.quantidade > 0 &&
    addForm.data_validade &&
    addForm.data_entrada &&
    addForm.localizacao;

  return (
    <main className="page">
      <h1 className="page-title">
        Gerenciar <span>Anúncios</span>
      </h1>
      <p className="page-subtitle">// ADICIONAR OU REMOVER DO ESTOQUE</p>

      <div className="manage-grid">
        <div className="panel">
          <div className="panel__header">
            <div className="panel__icon">+</div>
            <h2 className="panel__title">Adicionar Produto</h2>
          </div>
          <div className="panel__body">
            <div className="field">
              <label>Nome do Produto</label>
              <input name="nome" value={addForm.nome} onChange={handleAddChange} placeholder="Ex: Arroz Integral" />
            </div>
            <div className="field">
              <label>Quantidade (unidades)</label>
              <input name="quantidade" type="number" min="1" value={addForm.quantidade} onChange={handleAddChange} placeholder="Ex: 50" />
            </div>
            <div className="field">
              <label>Data de Validade</label>
              <input name="data_validade" type="date" value={addForm.data_validade} onChange={handleAddChange} />
            </div>
            <div className="field">
              <label>Data de Entrada do Anúncio</label>
              <input name="data_entrada" type="date" value={addForm.data_entrada} onChange={handleAddChange} />
            </div>
            <div className="field">
              <label>Localização</label>
              <input name="localizacao" value={addForm.localizacao} onChange={handleAddChange} placeholder="Ex: São Paulo" />
            </div>
            {addStatus && (
              <div className={`feedback ${addStatus.type}`}>{addStatus.msg}</div>
            )}
            <button className="btn btn-primary" onClick={handleAdd} disabled={!addValid || addLoading}>
              {addLoading ? 'Salvando...' : '↑ Adicionar ao Estoque'}
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panel__header">
            <div className="panel__icon">-</div>
            <h2 className="panel__title">Remover Produto</h2>
          </div>
          <div className="panel__body">
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Informe o ID do produto que deseja remover. Você pode conferir os IDs na página de Estoque.
            </p>
            <div className="field">
              <label>ID do Produto</label>
              <input type="number" min="1" value={removeId} onChange={(e) => setRemoveId(e.target.value)} placeholder="Ex: 3" />
            </div>
            {removeStatus && (
              <div className={`feedback ${removeStatus.type}`}>{removeStatus.msg}</div>
            )}
            <button className="btn btn-danger" onClick={handleRemove} disabled={!removeId || removeLoading}>
              {removeLoading ? 'Removendo...' : '↓ Remover do Estoque'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function App() {
  const [page, setPage] = useState('estoque');
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  const fetchProdutos = useCallback(async () => {
    try {
      const res = await fetch(`${API}/produtos`);
      const data = await res.json();
      setProdutos(data);
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdutos();
    const interval = setInterval(fetchProdutos, 5000);
    return () => clearInterval(interval);
  }, [fetchProdutos]);

  return (
    <>
      <Header page={page} setPage={setPage} />
      {page === 'estoque' ? (
        <EstoquePage produtos={produtos} loading={loading} online={online} />
      ) : (
        <GerenciarPage onRefresh={fetchProdutos} />
      )}
    </>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
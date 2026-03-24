import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageTransition } from '../components/public/PageTransition';

export function TermsPage() {
  const navigate = useNavigate();
  return (
    <PageTransition>
      <div className="px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6"><ArrowLeft className="w-4 h-4" /><span className="text-xs">Voltar</span></button>
        <h1 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Termos de Uso</h1>
        <p className="text-[10px] text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-mono)' }}>Última atualização: 19 de fevereiro de 2026</p>
        <div className="space-y-5 text-sm text-secondary-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
          <p>Ao utilizar o Power Sports, você aceita integralmente estes Termos.</p>
          <section><h2 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Serviço</h2><p>O Power Sports é operado por BBT ASSESSORIA DE COMUNICAÇÃO LTDA, CNPJ 90.070.459/0001-54, Rua Padre Anchieta, 1584/203, Encantado, RS.</p><p className="mt-2">A Plataforma oferece informações esportivas sobre campeonatos de futebol amador do Vale do Taquari.</p></section>
          <section><h2 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Acesso</h2><p>A Plataforma disponibiliza conteúdo gratuito e conteúdo premium. O acesso premium é oferecido mediante pagamento único válido pela duração do campeonato em curso, sem renovação automática.</p></section>
          <section><h2 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Pagamento</h2><p>O pagamento é processado por plataforma terceirizada. Não armazenamos dados financeiros. Não há reembolso após confirmação do pagamento.</p></section>
          <section><h2 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Conta</h2><p>O acesso premium é pessoal e intransferível, vinculado ao e-mail do comprador. O uso simultâneo é limitado a 2 dispositivos.</p></section>
          <section><h2 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Conteúdo</h2><p>As informações apresentadas têm caráter exclusivamente informativo e são baseadas em registros públicos. Não garantimos ausência de erros ou atrasos.</p></section>
          <section><h2 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Propriedade Intelectual</h2><p>Todo o conteúdo da Plataforma é de propriedade exclusiva de BBT ASSESSORIA DE COMUNICAÇÃO LTDA. É proibida qualquer reprodução sem autorização prévia por escrito.</p></section>
          <section><h2 className="text-base font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>Foro</h2><p>Fica eleito o Foro da Comarca de Encantado, RS, com exclusão de qualquer outro.</p></section>
        </div>
      </div>
    </PageTransition>
  );
}

import { Profile, AppRole } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportPrintViewProps {
  profiles: Profile[];
  getUserRole: (userId: string) => AppRole;
  fields: {
    basicos: boolean;
    pessoais: boolean;
    endereco: boolean;
    contato_emergencia: boolean;
    formacao: boolean;
    saude: boolean;
  };
  filters: {
    role: string;
    pelotao_id: string;
    perfil_completo: string;
    tipo_sanguineo: string;
  };
  reportTitle?: string;
}

export function ReportPrintView({
  profiles,
  getUserRole,
  fields,
  filters,
  reportTitle = 'Relatório de Usuários'
}: ReportPrintViewProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return date;
    }
  };

  const getRoleLabel = (role: AppRole) => {
    return role === 'admin' ? 'Administrador' : role === 'instrutor' ? 'Instrutor' : 'Aluno';
  };

  return (
    <div className="report-print-view">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .report-print-view,
          .report-print-view * {
            visibility: visible;
          }
          .report-print-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }

        .report-print-view {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px;
          background: white;
        }

        .report-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #1a365d;
        }

        .report-header h1 {
          font-size: 24px;
          color: #1a365d;
          margin: 0 0 10px 0;
          font-weight: bold;
        }

        .report-header .subtitle {
          font-size: 14px;
          color: #666;
        }

        .report-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 15px;
          background: #f7fafc;
          border-radius: 8px;
          font-size: 12px;
        }

        .report-meta-item {
          display: flex;
          flex-direction: column;
        }

        .report-meta-item label {
          font-weight: bold;
          color: #4a5568;
          margin-bottom: 2px;
        }

        .report-meta-item span {
          color: #1a365d;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 11px;
        }

        .report-table thead {
          background: #1a365d;
          color: white;
        }

        .report-table th {
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #ddd;
        }

        .report-table td {
          padding: 10px 8px;
          border: 1px solid #ddd;
          vertical-align: top;
        }

        .report-table tbody tr:nth-child(even) {
          background: #f7fafc;
        }

        .report-table tbody tr:hover {
          background: #edf2f7;
        }

        .report-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
          font-size: 11px;
          color: #666;
        }

        .section-title {
          font-size: 16px;
          font-weight: bold;
          color: #1a365d;
          margin: 30px 0 15px 0;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }

        .sensitive-data {
          background: #fff5f5;
          padding: 2px 6px;
          border-radius: 4px;
          color: #c53030;
          font-size: 10px;
        }

        @page {
          margin: 2cm;
        }
      `}</style>

      <div className="report-header">
        <h1>{reportTitle}</h1>
        <div className="subtitle">Sistema de Gestão - Corpo de Bombeiros</div>
      </div>

      <div className="report-meta">
        <div className="report-meta-item">
          <label>Data de Geração:</label>
          <span>{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
        </div>
        <div className="report-meta-item">
          <label>Total de Registros:</label>
          <span>{profiles.length}</span>
        </div>
        <div className="report-meta-item">
          <label>Filtros Aplicados:</label>
          <span>
            {filters.role !== 'todos' && `Tipo: ${filters.role} • `}
            {filters.perfil_completo !== 'todos' && `Perfil: ${filters.perfil_completo} • `}
            {filters.tipo_sanguineo !== 'todos' && `Sangue: ${filters.tipo_sanguineo}`}
            {filters.role === 'todos' && filters.perfil_completo === 'todos' && filters.tipo_sanguineo === 'todos' && 'Nenhum'}
          </span>
        </div>
      </div>

      {/* Dados Básicos */}
      {fields.basicos && (
        <>
          <div className="section-title">Dados Básicos</div>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>#</th>
                <th style={{ width: '30%' }}>Nome</th>
                <th style={{ width: '25%' }}>Email</th>
                <th style={{ width: '15%' }}>Telefone</th>
                <th style={{ width: '15%' }}>Matrícula</th>
                <th style={{ width: '10%' }}>Papel</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile, index) => (
                <tr key={profile.id}>
                  <td>{index + 1}</td>
                  <td>{profile.nome}</td>
                  <td>{profile.email}</td>
                  <td>{profile.telefone || '-'}</td>
                  <td>{profile.matricula || '-'}</td>
                  <td>{getRoleLabel(getUserRole(profile.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Dados Pessoais */}
      {fields.pessoais && (
        <>
          <div className="section-title">Dados Pessoais</div>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Nome</th>
                <th style={{ width: '20%' }}>CPF</th>
                <th style={{ width: '15%' }}>Data Nasc.</th>
                <th style={{ width: '15%' }}>Sexo</th>
                <th style={{ width: '15%' }}>Tipo Sang.</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.nome}</td>
                  <td>{profile.cpf || '-'}</td>
                  <td>{formatDate(profile.data_nascimento)}</td>
                  <td>{profile.sexo || '-'}</td>
                  <td>{profile.tipo_sanguineo || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Endereço */}
      {fields.endereco && (
        <>
          <div className="section-title">Endereço</div>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Nome</th>
                <th style={{ width: '10%' }}>CEP</th>
                <th style={{ width: '25%' }}>Logradouro</th>
                <th style={{ width: '8%' }}>Nº</th>
                <th style={{ width: '12%' }}>Bairro</th>
                <th style={{ width: '15%' }}>Cidade</th>
                <th style={{ width: '5%' }}>UF</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.nome}</td>
                  <td>{profile.endereco?.cep || '-'}</td>
                  <td>{profile.endereco?.logradouro || '-'}</td>
                  <td>{profile.endereco?.numero || '-'}</td>
                  <td>{profile.endereco?.bairro || '-'}</td>
                  <td>{profile.endereco?.cidade || '-'}</td>
                  <td>{profile.endereco?.uf || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Contato de Emergência */}
      {fields.contato_emergencia && (
        <>
          <div className="section-title">Contato de Emergência</div>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Usuário</th>
                <th style={{ width: '30%' }}>Contato Emergência</th>
                <th style={{ width: '20%' }}>Parentesco</th>
                <th style={{ width: '20%' }}>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.nome}</td>
                  <td>{profile.contato_emergencia?.nome || '-'}</td>
                  <td>{profile.contato_emergencia?.parentesco || '-'}</td>
                  <td>{profile.contato_emergencia?.telefone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Formação */}
      {fields.formacao && (
        <>
          <div className="section-title">Formação e Cursos Operacionais</div>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Nome</th>
                <th style={{ width: '70%' }}>Cursos Operacionais</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.nome}</td>
                  <td style={{ whiteSpace: 'pre-line' }}>{profile.cursos_operacionais_outros || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Saúde */}
      {fields.saude && (
        <>
          <div className="section-title">
            Dados de Saúde <span className="sensitive-data">CONFIDENCIAL</span>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Nome</th>
                <th style={{ width: '10%' }}>Doença Crônica</th>
                <th style={{ width: '20%' }}>Qual</th>
                <th style={{ width: '20%' }}>Alergias</th>
                <th style={{ width: '25%' }}>Medicamentos</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.nome}</td>
                  <td>{profile.saude?.doenca_cronica ? 'Sim' : 'Não'}</td>
                  <td>{profile.saude?.doenca_cronica_qual || '-'}</td>
                  <td style={{ fontSize: '10px' }}>{profile.saude?.alergias || '-'}</td>
                  <td style={{ fontSize: '10px' }}>{profile.saude?.medicamentos_uso || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div className="report-footer">
        <p><strong>Documento Confidencial</strong></p>
        <p>Este relatório contém informações protegidas e deve ser tratado com confidencialidade.</p>
        <p>Gerado automaticamente pelo Sistema de Gestão - Corpo de Bombeiros</p>
      </div>
    </div>
  );
}

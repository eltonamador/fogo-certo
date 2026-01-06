import { z } from 'zod';

// Regex patterns
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const telefoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;
const cepRegex = /^\d{5}-\d{3}$/;

// Validação completa de CPF
export const validarCPF = (cpf: string): boolean => {
  const numeros = cpf.replace(/\D/g, '');

  if (numeros.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(numeros)) return false;

  // Validação dos dígitos verificadores
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto === 10 || resto === 11 ? 0 : resto;

  if (digito1 !== parseInt(numeros.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto === 10 || resto === 11 ? 0 : resto;

  return digito2 === parseInt(numeros.charAt(10));
};

// STEP 1: Identificação e Contato
export const step1Schema = z.object({
  cpf: z.string()
    .min(1, 'CPF é obrigatório')
    .regex(cpfRegex, 'CPF deve estar no formato 000.000.000-00')
    .refine(validarCPF, 'CPF inválido'),

  data_nascimento: z.string()
    .min(1, 'Data de nascimento é obrigatória')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        return age - 1 >= 16;
      }
      return age >= 16;
    }, 'Idade mínima é 16 anos'),

  sexo: z.enum(['Masculino', 'Feminino', 'Outro', 'Prefiro não informar'], {
    errorMap: () => ({ message: 'Selecione uma opção' })
  }).optional(),

  tipo_sanguineo: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: 'Tipo sanguíneo é obrigatório' })
  }),

  contato_emergencia: z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    parentesco: z.string().min(2, 'Parentesco é obrigatório'),
    telefone: z.string()
      .regex(telefoneRegex, 'Telefone deve estar no formato (00) 00000-0000')
  })
});

export type Step1FormData = z.infer<typeof step1Schema>;

// STEP 2: Endereço
export const step2Schema = z.object({
  endereco: z.object({
    cep: z.string()
      .min(1, 'CEP é obrigatório')
      .regex(cepRegex, 'CEP deve estar no formato 00000-000'),
    logradouro: z.string().min(3, 'Logradouro é obrigatório'),
    numero: z.string().min(1, 'Número é obrigatório'),
    complemento: z.string().optional(),
    bairro: z.string().min(2, 'Bairro é obrigatório'),
    cidade: z.string().min(2, 'Cidade é obrigatória'),
    uf: z.string()
      .length(2, 'UF deve ter 2 caracteres')
      .regex(/^[A-Z]{2}$/, 'UF deve conter apenas letras maiúsculas')
  })
});

export type Step2FormData = z.infer<typeof step2Schema>;

// STEP 3: Militar/Formação/Experiência
export const step3Schema = z.object({
  cursos_operacionais: z.array(z.string()).optional(),
  cursos_operacionais_outros: z.string().optional(),

  formacao_academica: z.array(z.object({
    nivel: z.string().min(1, 'Nível é obrigatório'),
    curso: z.string().min(1, 'Curso é obrigatório'),
    instituicao: z.string().min(1, 'Instituição é obrigatória'),
    ano: z.string().regex(/^\d{4}$/, 'Ano deve ter 4 dígitos')
  })).optional(),

  experiencia_profissional: z.array(z.object({
    cargo: z.string().min(1, 'Cargo é obrigatório'),
    instituicao_empresa: z.string().min(1, 'Instituição/Empresa é obrigatória'),
    periodo_inicio: z.string().min(1, 'Período de início é obrigatório'),
    periodo_fim: z.string().min(1, 'Período de fim é obrigatório'),
    descricao: z.string().optional()
  })).optional()
});

export type Step3FormData = z.infer<typeof step3Schema>;

// STEP 4: Saúde
export const step4Schema = z.object({
  saude: z.object({
    doenca_cronica: z.boolean(),
    doenca_cronica_qual: z.string().optional(),
    alergias: z.string().optional(),
    medicamentos_uso: z.string().optional(),
    restricao_fisica: z.string().optional(),
    observacoes_medicas: z.string().optional(),
    consentimento_data: z.string()
  }).refine((data) => {
    if (data.doenca_cronica && !data.doenca_cronica_qual) {
      return false;
    }
    return true;
  }, {
    message: 'Especifique qual doença crônica',
    path: ['doenca_cronica_qual']
  })
});

export type Step4FormData = z.infer<typeof step4Schema>;

// Schema completo (união de todos)
export const profileCompleteSchema = z.object({
  ...step1Schema.shape,
  ...step2Schema.shape,
  ...step3Schema.shape,
  ...step4Schema.shape
});

export type ProfileCompleteFormData = z.infer<typeof profileCompleteSchema>;

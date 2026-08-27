import { Event } from '../types/Event';

export type RootStackParamList = {
  // --- Auth / Login ---
  Login: undefined;
  Register: undefined;
  RecuperarSenha: undefined;
  NovaSenha: undefined;

  // --- User Flow ---
  UserPage: undefined;
  UserPageNew: undefined;
  DetalhesEventos: { eventId: string };
  ComprarIngresso: { event: Event };
  ConfirmarCompra: { 
    event: Event; 
    quantity: number; 
    total: number;
    paymentId?: string;
  };
  IngressosComprados: undefined;
  QRCodepage: {ticketId: string};

  // --- Admin Flow ---
  Administração: undefined;
  Pessoas: undefined;
  PessoaDetalhes: { ticketId: string };
  Dashboard: undefined;
  Scanner: undefined;
  CreateEvent: undefined;
  EditEvent: undefined;
  AdminEventsList: undefined;
  UsuariosCadastrados: undefined;
  EditUserRole: { userId: string };
};
'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, User, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Client {
  nombre: string
  nrocta: string
  cuit?: string
}

interface ClientSelectorProps {
  clients: Client[]
  selectedClient: Client | null
  onSelect: (client: Client) => void
  /** Estilo compacto para la barra de navegación inferior */
  variant?: 'default' | 'nav'
}

export default function ClientSelector({ clients, selectedClient, onSelect, variant = 'default' }: ClientSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nrocta.includes(searchTerm)
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isNav = variant === 'nav'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          isNav
            ? 'flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 h-8 transition-all text-left min-w-[140px] max-w-[200px]'
            : 'flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded px-3 py-1.5 h-9 transition-all text-left min-w-[180px] max-w-[220px]'
        }
      >
        <User size={isNav ? 12 : 14} className="text-white/70 shrink-0" />
        <div className="flex-grow truncate">
          {selectedClient ? (
            <span className={`font-black uppercase ${isNav ? 'text-[10px]' : 'text-[11px]'}`}>
              {selectedClient.nombre}
            </span>
          ) : (
            <span className={`font-bold text-white/50 uppercase ${isNav ? 'text-[10px]' : 'text-[11px]'}`}>
              Cliente
            </span>
          )}
        </div>
        <ChevronDown size={isNav ? 12 : 14} className={`text-white/70 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute top-full mt-2 w-72 bg-white rounded-lg shadow-2xl z-[10001] overflow-hidden border border-gray-100 ${isNav ? 'right-0 left-auto' : 'left-0'}`}
          >
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o cuenta..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-xs text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#0e8c85]/20 focus:border-[#0e8c85] outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <button
                    key={client.nrocta}
                    onClick={() => {
                      onSelect(client)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className={`
                      w-full text-left px-4 py-3 flex items-center justify-between transition-colors
                      ${selectedClient?.nrocta === client.nrocta ? 'bg-[#0e8c85]/5 text-[#001f3f]' : 'hover:bg-gray-50 text-gray-700'}
                    `}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase leading-tight">
                        {client.nombre}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">
                        Cuenta: {client.nrocta}
                      </span>
                    </div>
                    {selectedClient?.nrocta === client.nrocta && (
                      <Check size={14} className="text-[#0e8c85]" />
                    )}
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    No se encontraron clientes
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

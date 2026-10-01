import React, { useState } from 'react';
import { SHOP_ITEMS } from '../utils/bosses';
import { soundManager } from '../utils/audio';

export default function ShopModal({
  isOpen,
  onClose,
  coins,
  onSpendCoins,
  inventory,
  onBuyItem,
  onUseItem
}) {
  const [purchaseMsg, setPurchaseMsg] = useState(null);

  if (!isOpen) return null;

  const handleBuy = (item) => {
    if (coins < item.cost) {
      alert('Koin tidak cukup! Selesaikan sesi fokus atau quest untuk mendulang koin emas.');
      return;
    }

    soundManager.playQuestDone();
    onSpendCoins(item.cost);
    onBuyItem(item);

    setPurchaseMsg(`Berhasil membeli ${item.name}! 🎉`);
    setTimeout(() => setPurchaseMsg(null), 3000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 16, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#0d1322',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          padding: '28px',
          borderRadius: '24px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '26px' }}>🛒</span>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                Pasar Fokus & Ksatria
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Tukarkan koin disiplinmu dengan item tempur dan gelar kehormatan!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'var(--text-secondary)',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Current Balance Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '12px',
          padding: '10px 16px',
          marginBottom: '20px'
        }}>
          <span style={{ fontSize: '13px', color: '#fef08a', fontWeight: '600' }}>
            Saldo Koin Kamu:
          </span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#facc15' }}>
            🪙 {coins} Koin
          </span>
        </div>

        {/* Notification Alert */}
        {purchaseMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#6ee7b7',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '13px',
            textAlign: 'center',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            {purchaseMsg}
          </div>
        )}

        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {SHOP_ITEMS.map((item) => {
            const isOwned = inventory && inventory.some((inv) => inv.id === item.id);
            const canAfford = coins >= item.cost;

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(15, 23, 42, 0.7)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(30, 41, 59, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {item.icon}
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '280px' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>

                {/* Right button */}
                <div style={{ flexShrink: 0 }}>
                  {item.type === 'consumable' ? (
                    <button
                      className="btn-primary"
                      onClick={() => handleBuy(item)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        background: canAfford ? undefined : 'rgba(51, 65, 85, 0.5)',
                        opacity: canAfford ? 1 : 0.6
                      }}
                    >
                      Beli ({item.cost} 🪙)
                    </button>
                  ) : isOwned ? (
                    <span style={{
                      fontSize: '11px',
                      color: '#10b981',
                      fontWeight: '800',
                      background: 'rgba(16, 185, 129, 0.15)',
                      padding: '4px 10px',
                      borderRadius: '8px'
                    }}>
                      ✓ Dimiliki
                    </span>
                  ) : (
                    <button
                      className="btn-primary"
                      onClick={() => handleBuy(item)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        background: canAfford ? undefined : 'rgba(51, 65, 85, 0.5)',
                        opacity: canAfford ? 1 : 0.6
                      }}
                    >
                      Beli ({item.cost} 🪙)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            className="btn-secondary"
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            style={{ width: '100%' }}
          >
            Tutup Toko
          </button>
        </div>

      </div>
    </div>
  );
}

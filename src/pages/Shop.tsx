import { useCallback, useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Creature } from '../components/Creature';
import { getCreature, getProfile, updateCreature, updateProfile } from '../db';
import {
  CATEGORY_LABELS,
  COSMETIC_CATALOG,
  categoryForType,
  equipBackground,
  equipSkin,
  purchaseCosmetic,
  toggleAccessory,
  type CosmeticCategory,
} from '../game/cosmetics';
import type { Cosmetic, Creature as CreatureType, Profile } from '../types';
import './Shop.css';

const CATEGORIES: CosmeticCategory[] = ['skins', 'accessories', 'backgrounds'];

export function Shop() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [creature, setCreature] = useState<CreatureType | null>(null);
  const [category, setCategory] = useState<CosmeticCategory>('skins');
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [prof, crit] = await Promise.all([getProfile(), getCreature()]);
    setProfile(prof);
    setCreature(crit);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const items = COSMETIC_CATALOG.filter((c) => categoryForType(c.type) === category);

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2200);
  };

  const handleBuy = async (item: Cosmetic) => {
    if (!profile) return;
    const result = purchaseCosmetic(profile.coins, profile.ownedCosmetics, item.id);
    if (!result.ok) {
      flash(result.reason);
      return;
    }
    const updated = { ...profile, coins: result.coins, ownedCosmetics: result.owned };
    await updateProfile(updated);
    setProfile(updated);
    flash(`Snagged ${item.name}!`);
  };

  const handleEquip = async (item: Cosmetic) => {
    if (!profile || !creature) return;
    if (!profile.ownedCosmetics.includes(item.id)) return;

    if (item.type === 'skin') {
      const next = equipSkin(creature, item.id, profile.ownedCosmetics);
      if (next) {
        await updateCreature(next);
        setCreature(next);
        flash(`Wearing ${item.name}.`);
      }
    } else if (item.type === 'accessory') {
      const next = toggleAccessory(creature, item.id, profile.ownedCosmetics);
      if (next) {
        await updateCreature(next);
        setCreature(next);
        flash('Accessory toggled.');
      }
    } else if (item.type === 'background') {
      const next = equipBackground(creature, item.id, profile.ownedCosmetics);
      if (next) {
        await updateCreature(next);
        setCreature(next);
        flash(`Den set to ${item.name}.`);
      }
    }
  };

  if (!profile || !creature) {
    return (
      <Layout title="Shop">
        <p className="shop__loading">Dusting shelves…</p>
      </Layout>
    );
  }

  return (
    <Layout title="Shop">
      <div className="shop">
        <div className="shop__header">
          <p className="shop__coins">
            ◎ <strong>{profile.coins}</strong> coins
          </p>
          <Creature
            stage={creature.stage}
            status={creature.status}
            skin={creature.cosmetics.skin}
            accessories={creature.cosmetics.accessories}
            background={creature.cosmetics.background}
            size={100}
          />
        </div>

        {message && <p className="shop__toast">{message}</p>}

        <div className="shop__tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`shop__tab ${category === cat ? 'shop__tab--active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <ul className="shop__grid">
          {items.map((item) => {
            const owned = profile.ownedCosmetics.includes(item.id);
            const equipped =
              item.type === 'skin'
                ? creature.cosmetics.skin === item.id
                : item.type === 'accessory'
                  ? creature.cosmetics.accessories.includes(item.id)
                  : item.type === 'background'
                    ? creature.cosmetics.background === item.id
                    : false;
            return (
              <li key={item.id} className="shop__item">
                <div className="shop__item-head">
                  <h3 className="shop__item-name">{item.name}</h3>
                  <span className="shop__item-price">{item.price === 0 ? 'Starter' : `${item.price} ◎`}</span>
                </div>
                <p className="shop__item-desc">{item.description}</p>
                <div className="shop__item-actions">
                  {!owned && item.price > 0 && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => handleBuy(item)}
                      disabled={profile.coins < item.price}
                    >
                      Buy
                    </button>
                  )}
                  {owned && (
                    <button
                      type="button"
                      className={`btn btn--sm ${equipped ? 'btn--secondary' : 'btn--ghost'}`}
                      onClick={() => handleEquip(item)}
                    >
                      {equipped ? 'Equipped' : 'Equip'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <p className="shop__fine-print">Cosmetics only — never touches your card schedule.</p>
      </div>
    </Layout>
  );
}

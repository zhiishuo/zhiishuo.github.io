"use client";

import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Menu,
  Pause,
  Play,
  Plus,
  Route,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Memory = {
  id: string;
  title: string;
  place: string;
  province: string;
  date: string;
  note: string;
  image: string;
  lat: number;
  lng: number;
  tag: "城市" | "自然" | "人文";
  userCreated?: boolean;
};

type MapCanvasProps = {
  memories: Memory[];
  selectedId: string | null;
  showRoute: boolean;
  onSelect: (id: string) => void;
};

const seedMemories: Memory[] = [
  {
    id: "hangzhou-spring",
    title: "风经过西湖的时候",
    place: "杭州 · 西湖",
    province: "浙江",
    date: "2026-04-18",
    note: "傍晚的水面像一张慢慢显影的胶片。我们没有赶路，只沿着湖边走到天色变蓝。",
    image: "/memories/hangzhou.jpg",
    lat: 30.2424,
    lng: 120.1406,
    tag: "自然",
  },
  {
    id: "shanghai-night",
    title: "外滩的蓝调时刻",
    place: "上海 · 外滩",
    province: "上海",
    date: "2025-11-02",
    note: "城市亮起灯以后，黄浦江把所有颜色都收进水里。那晚的风很凉，心却很安静。",
    image: "/memories/shanghai.jpg",
    lat: 31.2407,
    lng: 121.4905,
    tag: "城市",
  },
  {
    id: "chengdu-garden",
    title: "一院春色，半日清闲",
    place: "成都 · 杜甫草堂",
    province: "四川",
    date: "2025-03-09",
    note: "花开得正好，树影落在旧墙上。旅行里最喜欢的，常常是计划之外的一小段停留。",
    image: "/memories/chengdu.jpg",
    lat: 30.6601,
    lng: 104.0289,
    tag: "人文",
  },
  {
    id: "dali-lake",
    title: "洱海边的慢时间",
    place: "大理 · 洱海",
    province: "云南",
    date: "2024-09-24",
    note: "云层压得很低，远山仍然清楚。坐在水边的那一小时，好像不属于任何日程。",
    image: "/memories/dali.jpg",
    lat: 25.7434,
    lng: 100.2299,
    tag: "自然",
  },
  {
    id: "qingdao-coast",
    title: "海风有自己的方向",
    place: "青岛 · 小麦岛",
    province: "山东",
    date: "2024-06-16",
    note: "沿着海岸一直走，城市的声音渐渐退到身后。蓝色从天空延伸到很远的地方。",
    image: "/memories/qingdao-cliff.jpg",
    lat: 36.0572,
    lng: 120.4286,
    tag: "自然",
  },
  {
    id: "beijing-autumn",
    title: "红墙外的秋日光线",
    place: "北京 · 故宫",
    province: "北京",
    date: "2023-10-27",
    note: "午后的光从檐角落下来，红墙像被时间重新擦亮。人很多，但抬头时仍能看见完整的秋天。",
    image: "/memories/beijing.jpg",
    lat: 39.9163,
    lng: 116.3972,
    tag: "人文",
  },
  {
    id: "hongkong-tram",
    title: "叮叮车驶过夜色",
    place: "香港 · 北角",
    province: "香港",
    date: "2023-05-20",
    note: "旧电车穿过霓虹和街灯，速度刚好够看清每扇亮着的窗。城市在夜里显得格外亲近。",
    image: "/memories/hongkong.jpg",
    lat: 22.2915,
    lng: 114.2005,
    tag: "城市",
  },
];

const cityPresets = [
  { label: "杭州 · 西湖", province: "浙江", lat: 30.2424, lng: 120.1406 },
  { label: "上海 · 外滩", province: "上海", lat: 31.2407, lng: 121.4905 },
  { label: "成都 · 市中心", province: "四川", lat: 30.657, lng: 104.066 },
  { label: "大理 · 洱海", province: "云南", lat: 25.7434, lng: 100.2299 },
  { label: "青岛 · 海岸", province: "山东", lat: 36.0671, lng: 120.3826 },
  { label: "北京 · 故宫", province: "北京", lat: 39.9163, lng: 116.3972 },
  { label: "香港 · 中环", province: "香港", lat: 22.2819, lng: 114.1586 },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function MapCanvas({ memories, selectedId, showRoute, onSelect }: MapCanvasProps) {
  const [mapReady, setMapReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const routeLayerRef = useRef<import("leaflet").Polyline | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const fittedCountRef = useRef(0);
  const memoriesRef = useRef(memories);

  useEffect(() => {
    memoriesRef.current = memories;
  }, [memories]);

  const fitAll = useCallback(() => {
    const currentMemories = memoriesRef.current;
    if (!mapRef.current || !leafletRef.current || currentMemories.length === 0) return;
    const bounds = leafletRef.current.latLngBounds(currentMemories.map((m) => [m.lat, m.lng]));
    mapRef.current.fitBounds(bounds, {
      paddingTopLeft: [70, 80],
      paddingBottomRight: [70, 120],
      maxZoom: 6,
      animate: true,
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    void import("leaflet").then((module) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const L = module.default;
      leafletRef.current = L;
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 3,
        maxZoom: 17,
        worldCopyJump: true,
      }).setView([31.6, 111.5], 4);

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 20,
        },
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
      markerLayerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 50);
    });

    const handleFit = () => fitAll();
    window.addEventListener("atlas:fit", handleFit);
    return () => {
      cancelled = true;
      window.removeEventListener("atlas:fit", handleFit);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [fitAll]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!L || !map || !layer) {
      const timer = window.setTimeout(() => {
        if (mapRef.current && fittedCountRef.current !== memories.length) fitAll();
      }, 180);
      return () => window.clearTimeout(timer);
    }

    layer.clearLayers();
    memories.forEach((memory) => {
      const markerNode = document.createElement("div");
      markerNode.className = `photo-pin${memory.id === selectedId ? " is-selected" : ""}`;
      const image = document.createElement("img");
      image.src = memory.image;
      image.alt = "";
      const pulse = document.createElement("span");
      pulse.className = "photo-pin-pulse";
      markerNode.append(image, pulse);

      const icon = L.divIcon({
        html: markerNode,
        className: "photo-pin-shell",
        iconSize: [58, 66],
        iconAnchor: [29, 62],
      });

      L.marker([memory.lat, memory.lng], {
        icon,
        keyboard: true,
        title: `查看${memory.place}的回忆`,
      })
        .on("click", () => onSelect(memory.id))
        .addTo(layer);
    });

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    if (showRoute && memories.length > 1) {
      const routePoints = [...memories]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((memory) => [memory.lat, memory.lng] as [number, number]);
      routeLayerRef.current = L.polyline(routePoints, {
        color: "#d9734f",
        weight: 2.5,
        opacity: 0.8,
        dashArray: "4 10",
        lineCap: "round",
      }).addTo(map);
      routeLayerRef.current.bringToBack();
    }

    if (fittedCountRef.current !== memories.length) {
      fittedCountRef.current = memories.length;
      fitAll();
    }
  }, [fitAll, mapReady, memories, onSelect, selectedId, showRoute]);

  useEffect(() => {
    const selected = memories.find((memory) => memory.id === selectedId);
    if (selected && mapRef.current) {
      mapRef.current.flyTo([selected.lat, selected.lng], Math.max(mapRef.current.getZoom(), 7), {
        duration: 0.65,
      });
    }
  }, [memories, selectedId]);

  return <div ref={containerRef} className="map-canvas" aria-label="回忆地图" />;
}

export function MemoryAtlas() {
  const [memories, setMemories] = useState<Memory[]>(seedMemories);
  const [selectedId, setSelectedId] = useState<string | null>(seedMemories[0].id);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<"全部" | Memory["tag"]>("全部");
  const [showRoute, setShowRoute] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTouring, setIsTouring] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let storedMemories: Memory[] | null = null;
    try {
      const stored = window.localStorage.getItem("shiguang-user-memories");
      if (stored) {
        const parsed = JSON.parse(stored) as Memory[];
        if (Array.isArray(parsed)) storedMemories = parsed;
      }
    } catch {
      // A blocked or malformed local store should never prevent the map from loading.
    }
    window.queueMicrotask(() => {
      if (storedMemories) setMemories([...storedMemories, ...seedMemories]);
      setHydrated(true);
    });
  }, []);

  const persistUserMemories = useCallback((all: Memory[]) => {
    try {
      window.localStorage.setItem(
        "shiguang-user-memories",
        JSON.stringify(all.filter((memory) => memory.userCreated)),
      );
    } catch {
      setToast("浏览器存储空间不足，这条回忆仅在本次浏览中保留");
    }
  }, []);

  const filteredMemories = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    return memories.filter((memory) => {
      const matchesTag = activeTag === "全部" || memory.tag === activeTag;
      const matchesQuery =
        !normalized ||
        `${memory.title} ${memory.place} ${memory.province} ${memory.note}`
          .toLocaleLowerCase("zh-CN")
          .includes(normalized);
      return matchesTag && matchesQuery;
    });
  }, [activeTag, memories, query]);

  const selectedMemory =
    filteredMemories.find((memory) => memory.id === selectedId) ??
    filteredMemories[0] ??
    null;

  const selectedIndex = selectedMemory
    ? filteredMemories.findIndex((memory) => memory.id === selectedMemory.id)
    : -1;

  const selectMemory = useCallback((id: string) => {
    setSelectedId(id);
    setMenuOpen(false);
  }, []);

  const moveSelection = useCallback(
    (direction: 1 | -1) => {
      if (filteredMemories.length === 0) return;
      const current = Math.max(
        0,
        filteredMemories.findIndex((memory) => memory.id === selectedMemory?.id),
      );
      const next = (current + direction + filteredMemories.length) % filteredMemories.length;
      setSelectedId(filteredMemories[next].id);
    },
    [filteredMemories, selectedMemory?.id],
  );

  useEffect(() => {
    if (!isTouring || filteredMemories.length < 2) return;
    const timer = window.setInterval(() => moveSelection(1), 3800);
    return () => window.clearInterval(timer);
  }, [filteredMemories.length, isTouring, moveSelection]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (addOpen) return;
      if (event.key === "ArrowRight") moveSelection(1);
      if (event.key === "ArrowLeft") moveSelection(-1);
      if (event.key === "Escape") setIsTouring(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [addOpen, moveSelection]);

  const handleAdd = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const preset = cityPresets[Number(form.get("preset"))] ?? cityPresets[0];
    const newMemory: Memory = {
      id: `memory-${Date.now()}`,
      title: String(form.get("title") || "未命名的回忆").trim(),
      place: String(form.get("place") || preset.label).trim(),
      province: preset.province,
      date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
      note: String(form.get("note") || "这一刻值得被好好记住。").trim(),
      image: imagePreview || "/memories/hangzhou.jpg",
      lat: preset.lat,
      lng: preset.lng,
      tag: String(form.get("tag") || "城市") as Memory["tag"],
      userCreated: true,
    };
    const next = [newMemory, ...memories];
    setMemories(next);
    persistUserMemories(next);
    setSelectedId(newMemory.id);
    setAddOpen(false);
    setImagePreview("");
    setToast("回忆已经落在地图上");
    event.currentTarget.reset();
  };

  const handleImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("请选择图片文件");
      return;
    }
    if (file.size > 1_500_000) {
      setToast("图片请控制在 1.5MB 以内");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!selectedMemory?.userCreated) return;
    const next = memories.filter((memory) => memory.id !== selectedMemory.id);
    setMemories(next);
    persistUserMemories(next);
    setSelectedId(next[0]?.id ?? null);
    setToast("已移除这条回忆");
  };

  const provinceCount = new Set(memories.map((memory) => memory.province)).size;

  return (
    <main className="atlas-shell">
      <div className="map-stage">
        <MapCanvas
          memories={filteredMemories}
          selectedId={selectedMemory?.id ?? null}
          showRoute={showRoute}
          onSelect={selectMemory}
        />
        <div className="map-wash" aria-hidden="true" />

        <header className="topbar">
          <button
            type="button"
            className="mobile-menu-button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label="打开回忆列表"
            aria-expanded={menuOpen}
          >
            <Menu size={20} />
          </button>
          <a className="brand" href="#" aria-label="拾光地图首页">
            <span className="brand-mark"><Compass size={19} strokeWidth={1.8} /></span>
            <span>
              <strong>拾光地图</strong>
              <small>MEMORY ATLAS</small>
            </span>
          </a>
          <div className="top-actions">
            <button
              type="button"
              className={`glass-button ${showRoute ? "is-active" : ""}`}
              onClick={() => setShowRoute((value) => !value)}
              aria-pressed={showRoute}
            >
              <Route size={17} />
              <span>旅途连线</span>
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => setAddOpen(true)}
            >
              <Plus size={17} />
              <span>添加回忆</span>
            </button>
          </div>
        </header>

        <div className="map-tools">
          <button
            type="button"
            className="round-tool"
            onClick={() => window.dispatchEvent(new Event("atlas:fit"))}
            aria-label="查看全部地点"
            title="查看全部地点"
          >
            <LocateFixed size={18} />
          </button>
        </div>

        {selectedMemory && (
          <article className="story-dock" aria-live="polite">
            <img src={selectedMemory.image} alt={selectedMemory.title} />
            <div className="story-dock-copy">
              <div className="eyebrow">
                <MapPin size={13} />
                {selectedMemory.place}
              </div>
              <h2>{selectedMemory.title}</h2>
              <p>{selectedMemory.note}</p>
              <div className="story-meta">
                <span>{formatDate(selectedMemory.date)}</span>
                <span className="dot" />
                <span>{selectedMemory.tag}</span>
              </div>
            </div>
            <div className="story-nav">
              <span>{String(selectedIndex + 1).padStart(2, "0")} / {String(filteredMemories.length).padStart(2, "0")}</span>
              <div>
                <button type="button" onClick={() => moveSelection(-1)} aria-label="上一条回忆">
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className={isTouring ? "is-playing" : ""}
                  onClick={() => setIsTouring((value) => !value)}
                  aria-label={isTouring ? "暂停漫游" : "开始漫游"}
                >
                  {isTouring ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button type="button" onClick={() => moveSelection(1)} aria-label="下一条回忆">
                  <ChevronRight size={18} />
                </button>
              </div>
              {selectedMemory.userCreated && (
                <button type="button" className="delete-memory" onClick={deleteSelected}>
                  <Trash2 size={14} /> 移除
                </button>
              )}
            </div>
          </article>
        )}

        {filteredMemories.length === 0 && (
          <div className="empty-map">
            <Search size={22} />
            <h2>没有找到这段回忆</h2>
            <button type="button" onClick={() => { setQuery(""); setActiveTag("全部"); }}>
              清除筛选
            </button>
          </div>
        )}
      </div>

      <aside className={`memory-panel ${menuOpen ? "is-open" : ""}`}>
        <div className="panel-handle" aria-hidden="true" />
        <div className="panel-intro">
          <div>
            <span className="intro-kicker"><Sparkles size={13} /> 私人时光档案</span>
            <h1>把走过的地方，<br />收进一张会呼吸的地图。</h1>
          </div>
          <button
            className="mobile-close"
            type="button"
            onClick={() => setMenuOpen(false)}
            aria-label="关闭回忆列表"
          >
            <X size={19} />
          </button>
        </div>

        <div className="stat-row">
          <div><strong>{memories.length}</strong><span>段回忆</span></div>
          <div><strong>{provinceCount}</strong><span>个地方</span></div>
          <div><strong>{new Set(memories.map((memory) => memory.date.slice(0, 4))).size}</strong><span>年光景</span></div>
        </div>

        <label className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索地点或回忆"
            aria-label="搜索地点或回忆"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="清除搜索">
              <X size={15} />
            </button>
          )}
        </label>

        <div className="tag-row" aria-label="回忆类型筛选">
          {(["全部", "城市", "自然", "人文"] as const).map((tag) => (
            <button
              key={tag}
              type="button"
              className={activeTag === tag ? "is-active" : ""}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="section-heading">
          <span>回忆胶卷</span>
          <small>{filteredMemories.length} STORIES</small>
        </div>

        <div className="memory-list">
          {filteredMemories.map((memory, index) => (
            <button
              type="button"
              key={memory.id}
              className={`memory-card ${memory.id === selectedMemory?.id ? "is-selected" : ""}`}
              onClick={() => selectMemory(memory.id)}
            >
              <span className="memory-index">{String(index + 1).padStart(2, "0")}</span>
              <img src={memory.image} alt="" />
              <span className="memory-card-copy">
                <small>{memory.place}</small>
                <strong>{memory.title}</strong>
                <span>{memory.date.replaceAll("-", ".")}</span>
              </span>
              <span className="card-arrow"><ArrowRight size={16} /></span>
            </button>
          ))}
        </div>

        <footer className="panel-footer">
          <span><span className="live-dot" /> {hydrated ? "已在此设备保存" : "正在载入"}</span>
          <button type="button" onClick={() => setAddOpen(true)}><Plus size={14} /> 新回忆</button>
        </footer>
      </aside>

      <nav className="mobile-nav" aria-label="移动端快捷操作">
        <button type="button" onClick={() => setMenuOpen(true)}>
          <MapIcon size={19} /><span>回忆</span>
        </button>
        <button type="button" className="mobile-add" onClick={() => setAddOpen(true)} aria-label="添加回忆">
          <Plus size={23} />
        </button>
        <button type="button" onClick={() => setShowRoute((value) => !value)}>
          <Route size={19} /><span>路线</span>
        </button>
      </nav>

      {addOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setAddOpen(false)}>
          <section
            className="add-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-top">
              <div>
                <span className="intro-kicker"><Camera size={13} /> NEW MEMORY</span>
                <h2 id="add-title">收藏此刻</h2>
                <p>选一张照片，让它在地图上拥有坐标。</p>
              </div>
              <button type="button" onClick={() => setAddOpen(false)} aria-label="关闭">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <label className={`image-picker ${imagePreview ? "has-image" : ""}`}>
                {imagePreview ? (
                  <img src={imagePreview} alt="待添加照片预览" />
                ) : (
                  <>
                    <span><Camera size={23} /></span>
                    <strong>选择一张照片</strong>
                    <small>JPG / PNG，建议小于 1.5MB</small>
                  </>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => handleImage(event.target.files?.[0])}
                />
              </label>
              <div className="form-grid">
                <label>
                  <span>回忆标题</span>
                  <input name="title" required placeholder="例如：风经过西湖的时候" />
                </label>
                <label>
                  <span>日期</span>
                  <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                </label>
                <label>
                  <span>地图坐标</span>
                  <select name="preset" defaultValue="0">
                    {cityPresets.map((city, index) => (
                      <option key={city.label} value={index}>{city.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>地点显示</span>
                  <input name="place" placeholder="不填则使用上方地点" />
                </label>
                <label>
                  <span>类型</span>
                  <select name="tag" defaultValue="城市">
                    <option>城市</option>
                    <option>自然</option>
                    <option>人文</option>
                  </select>
                </label>
                <label className="wide-field">
                  <span>写下这一刻</span>
                  <textarea name="note" rows={3} placeholder="那天发生了什么？" />
                </label>
              </div>
              <div className="form-note">
                <Check size={15} />
                新回忆只保存在当前浏览器，不会上传到服务器。
              </div>
              <button className="submit-memory" type="submit">
                <MapPin size={17} /> 放到地图上
              </button>
            </form>
          </section>
        </div>
      )}

      {toast && <div className="toast-message" role="status"><Check size={16} /> {toast}</div>}
    </main>
  );
}

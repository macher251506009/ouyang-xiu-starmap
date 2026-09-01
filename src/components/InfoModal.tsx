export default function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="modal-mask"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="资料说明"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>资料说明</h3>
        <p>
          本图依据用户提供的人物关系资料整理，用于关系探索与文学史学习。部分复杂亲属称谓及个别人名仍待进一步校勘。
        </p>
        <p>
          · 图中关系均来自所给资料，凡资料未提及之人物关系，本图一律不擅自添加或编造。
        </p>
        <p>
          · 标注为「待复核」的内容（如“苏箦（姓名待复核）”“三同”）系原资料字形不清、或含义待考之处，予以保留说明，不作擅自改动。
        </p>
        <p>
          · 本图不作为绝对完整的历史事实，仅供学习与探索。
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button className="btn primary" onClick={onClose} aria-label="关闭资料说明">
            我已知晓
          </button>
        </div>
      </div>
    </div>
  );
}

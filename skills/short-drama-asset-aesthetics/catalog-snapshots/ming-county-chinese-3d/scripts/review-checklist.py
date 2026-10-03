"""Manual review checklist helper; optional text asset, never auto-executed by generation."""
CHECKS = ["时代身份与场合", "帽领襟袖带鞋形制", "年龄脸型轮廓", "布皮木铁铜材质", "门窗家具支撑与动线", "手脸与具体缺陷", "用户确认及范围"]
def checklist(asset_id):
    return {"assetId": asset_id, "approvalStatus": "candidate", "checks": {x: "待人工查看实际图片" for x in CHECKS}}

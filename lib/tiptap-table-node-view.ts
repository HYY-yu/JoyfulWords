import type { Editor } from "@tiptap/core"
import { Table } from "@tiptap/extension-table"
import { Fragment, type Node as ProseMirrorNode } from "@tiptap/pm/model"
import { addColumn, addRow, TableMap } from "@tiptap/pm/tables"
import type { EditorView, NodeView, ViewMutationRecord } from "@tiptap/pm/view"
import { HIGHLIGHT_COLORS } from "@/lib/editor-color-palette"

type GetPos = (() => number | undefined) | boolean
type TableMenuType = "row" | "column"
const TABLE_BACKGROUND_ALPHA = 0.8

interface ActiveCellPosition {
  cell: HTMLTableCellElement
  columnIndex: number
  rowIndex: number
}

const TABLE_MENU_LABELS = {
  en: {
    background: "Background",
    clearColumn: "Clear column contents",
    clearRow: "Clear row contents",
    deleteColumn: "Delete column",
    deleteRow: "Delete row",
    duplicateContents: "Duplicate contents",
    insertAbove: "Insert Above",
    insertBelow: "Insert Below",
    insertLeft: "Insert Left",
    insertRight: "Insert Right",
    manage: "Manage",
    moveDown: "Move Down",
    moveLeft: "Move Left",
    moveRight: "Move Right",
    moveUp: "Move Up",
    openColumnMenu: "Open column menu",
    openRowMenu: "Open row menu",
    position: "Position",
  },
  zh: {
    background: "背景色",
    clearColumn: "清空列内容",
    clearRow: "清空行内容",
    deleteColumn: "删除列",
    deleteRow: "删除行",
    duplicateContents: "复制内容",
    insertAbove: "上方插入",
    insertBelow: "下方插入",
    insertLeft: "左侧插入",
    insertRight: "右侧插入",
    manage: "功能管理",
    moveDown: "下移",
    moveLeft: "左移",
    moveRight: "右移",
    moveUp: "上移",
    openColumnMenu: "打开列菜单",
    openRowMenu: "打开行菜单",
    position: "位移",
  },
} as const

function getTableMenuLabels() {
  return document.documentElement.lang.toLowerCase().startsWith("zh")
    ? TABLE_MENU_LABELS.zh
    : TABLE_MENU_LABELS.en
}

function withTableBackgroundAlpha(color: string) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)

  if (!match) {
    return color
  }

  const [, red, green, blue] = match

  return `rgba(${Number.parseInt(red, 16)}, ${Number.parseInt(green, 16)}, ${Number.parseInt(blue, 16)}, ${TABLE_BACKGROUND_ALPHA})`
}

function getCellKey(activeCell: ActiveCellPosition) {
  return `${activeCell.rowIndex}:${activeCell.columnIndex}`
}

class TableControlsView implements NodeView {
  node: ProseMirrorNode
  view: EditorView
  editor: Editor
  getPos: GetPos
  dom: HTMLDivElement
  table: HTMLTableElement
  contentDOM: HTMLTableSectionElement
  topHandle: HTMLButtonElement
  leftHandle: HTMLButtonElement
  menu: HTMLDivElement
  activeCellOverlay: HTMLDivElement
  private activeCellKey: string | null = null
  private activeMenuType: TableMenuType | null = null
  private updateFrame: number | null = null

  constructor(node: ProseMirrorNode, editor: Editor, getPos: GetPos) {
    this.node = node
    this.editor = editor
    this.view = editor.view
    this.getPos = getPos

    this.dom = document.createElement("div")
    this.dom.className = "jw-table-wrapper"

    this.topHandle = this.createHandle("jw-table-handle jw-table-handle-top", "column")
    this.leftHandle = this.createHandle("jw-table-handle jw-table-handle-left", "row")
    this.menu = document.createElement("div")
    this.menu.className = "jw-table-menu"
    this.menu.contentEditable = "false"
    this.menu.hidden = true
    this.activeCellOverlay = document.createElement("div")
    this.activeCellOverlay.className = "jw-table-cell-selection"
    this.activeCellOverlay.contentEditable = "false"
    this.activeCellOverlay.setAttribute("aria-hidden", "true")
    const addColumnButton = this.createControl("jw-table-control jw-table-add-column", "+", () => {
      this.appendColumn()
    })
    const addRowButton = this.createControl("jw-table-control jw-table-add-row", "+", () => {
      this.appendRow()
    })

    this.table = document.createElement("table")
    this.table.className = "jw-editor-table"
    this.contentDOM = this.table.appendChild(document.createElement("tbody"))

    this.dom.append(
      this.topHandle,
      this.leftHandle,
      this.menu,
      this.activeCellOverlay,
      this.table,
      addColumnButton,
      addRowButton
    )

    this.editor.on("selectionUpdate", this.scheduleControlsUpdate)
    this.dom.addEventListener("focusin", this.scheduleControlsUpdate)
    this.dom.addEventListener("mouseup", this.scheduleControlsUpdate)
    this.dom.addEventListener("mousedown", this.handleWrapperMouseDown)
    document.addEventListener("mousedown", this.handleDocumentMouseDown)
    this.scheduleControlsUpdate()
  }

  update(node: ProseMirrorNode) {
    if (node.type !== this.node.type) {
      return false
    }

    this.node = node
    this.scheduleControlsUpdate()
    return true
  }

  destroy() {
    this.editor.off("selectionUpdate", this.scheduleControlsUpdate)
    this.dom.removeEventListener("focusin", this.scheduleControlsUpdate)
    this.dom.removeEventListener("mouseup", this.scheduleControlsUpdate)
    this.dom.removeEventListener("mousedown", this.handleWrapperMouseDown)
    document.removeEventListener("mousedown", this.handleDocumentMouseDown)

    if (this.updateFrame !== null) {
      cancelAnimationFrame(this.updateFrame)
      this.updateFrame = null
    }
  }

  stopEvent(event: Event) {
    return event.target instanceof HTMLElement &&
      event.target.closest(".jw-table-control, .jw-table-handle, .jw-table-menu") !== null
  }

  ignoreMutation(mutation: ViewMutationRecord) {
    if (mutation.type === "selection") {
      return false
    }

    const target = mutation.target as Node
    const isInsideWrapper = this.dom.contains(target)
    const isInsideTableContent = this.contentDOM.contains(target)

    return isInsideWrapper && !isInsideTableContent
  }

  private createHandle(className: string, type: TableMenuType) {
    const handle = document.createElement("button")
    const labels = getTableMenuLabels()
    handle.type = "button"
    handle.className = className
    handle.contentEditable = "false"
    handle.setAttribute("aria-label", type === "row" ? labels.openRowMenu : labels.openColumnMenu)
    handle.innerHTML = [
      '<svg viewBox="0 0 24 8" aria-hidden="true" focusable="false">',
      '<circle cx="5" cy="4" r="2" />',
      '<circle cx="12" cy="4" r="2" />',
      '<circle cx="19" cy="4" r="2" />',
      '</svg>',
    ].join("")
    handle.addEventListener("mousedown", (event) => {
      event.preventDefault()
      event.stopPropagation()
    })
    handle.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.toggleMenu(type)
    })
    return handle
  }

  private createControl(className: string, label: string, onClick: () => void) {
    const button = document.createElement("button")
    button.type = "button"
    button.className = className
    button.contentEditable = "false"
    button.textContent = label
    button.addEventListener("mousedown", (event) => {
      event.preventDefault()
    })
    button.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      onClick()
    })
    return button
  }

  private handleDocumentMouseDown = (event: MouseEvent) => {
    if (!this.activeMenuType) {
      return
    }

    const target = event.target
    if (target instanceof Node && this.dom.contains(target)) {
      return
    }

    this.closeMenu()
  }

  private handleWrapperMouseDown = (event: MouseEvent) => {
    if (!this.activeMenuType || !(event.target instanceof HTMLElement)) {
      return
    }

    if (event.target.closest(".jw-table-control, .jw-table-handle, .jw-table-menu")) {
      return
    }

    if (event.target.closest("td, th")) {
      this.closeMenu()
    }
  }

  private scheduleControlsUpdate = () => {
    if (this.updateFrame !== null) {
      return
    }

    this.updateFrame = requestAnimationFrame(() => {
      this.updateFrame = null
      this.updateActiveCellControls()
    })
  }

  private clearActiveCell() {
    this.activeCellOverlay.removeAttribute("style")
    this.dom.classList.remove("jw-table-has-active-cell")
    this.activeCellKey = null
  }

  private getTablePosition() {
    if (typeof this.getPos !== "function") {
      return null
    }

    const tablePos = this.getPos()
    return typeof tablePos === "number" ? tablePos : null
  }

  private getCurrentCellElement() {
    const tablePos = this.getTablePosition()
    if (tablePos === null) {
      return null
    }

    const selectionFrom = this.view.state.selection.from
    const tableEnd = tablePos + this.node.nodeSize

    if (selectionFrom <= tablePos || selectionFrom >= tableEnd) {
      return null
    }

    const { node } = this.view.domAtPos(selectionFrom)
    const startElement =
      node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement | null

    let current: HTMLElement | null = startElement
    while (current && current !== this.dom) {
      if (
        current instanceof HTMLTableCellElement &&
        this.table.contains(current)
      ) {
        return current
      }

      current = current.parentElement
    }

    return null
  }

  private getActiveCellPosition(): ActiveCellPosition | null {
    const cell = this.getCurrentCellElement()
    const row = cell?.parentElement

    if (!cell || !(row instanceof HTMLTableRowElement)) {
      return null
    }

    return {
      cell,
      columnIndex: cell.cellIndex,
      rowIndex: row.sectionRowIndex,
    }
  }

  private updateActiveCellControls() {
    const activeCell = this.getActiveCellPosition()
    const previousCellKey = this.activeCellKey

    this.clearActiveCell()

    if (!activeCell) {
      this.closeMenu()
      return
    }

    const nextCellKey = getCellKey(activeCell)
    if (this.activeMenuType && previousCellKey && previousCellKey !== nextCellKey) {
      this.closeMenu()
    }
    this.activeCellKey = nextCellKey

    const wrapperRect = this.dom.getBoundingClientRect()
    const cellRect = activeCell.cell.getBoundingClientRect()

    this.dom.classList.add("jw-table-has-active-cell")
    this.activeCellOverlay.style.left = `${cellRect.left - wrapperRect.left}px`
    this.activeCellOverlay.style.top = `${cellRect.top - wrapperRect.top}px`
    this.activeCellOverlay.style.width = `${cellRect.width}px`
    this.activeCellOverlay.style.height = `${cellRect.height}px`
    this.topHandle.style.left = `${cellRect.left - wrapperRect.left + cellRect.width / 2}px`
    this.leftHandle.style.top = `${cellRect.top - wrapperRect.top + cellRect.height / 2}px`
    this.updateMenuPosition(activeCell.cell)
  }

  private getTableContext() {
    if (typeof this.getPos !== "function") {
      return null
    }

    const tablePos = this.getPos()
    if (typeof tablePos !== "number") {
      return null
    }

    const map = TableMap.get(this.node)

    return {
      bottom: map.height,
      left: 0,
      map,
      right: map.width,
      table: this.node,
      tableStart: tablePos + 1,
      top: 0,
    }
  }

  private appendColumn() {
    const context = this.getTableContext()
    if (!context) return

    const transaction = this.view.state.tr
    addColumn(transaction, context, context.map.width)
    this.view.dispatch(transaction.scrollIntoView())
    this.view.focus()
    this.scheduleControlsUpdate()
  }

  private appendRow() {
    const context = this.getTableContext()
    if (!context) return

    const transaction = this.view.state.tr
    addRow(transaction, context, context.map.height)
    this.view.dispatch(transaction.scrollIntoView())
    this.view.focus()
    this.scheduleControlsUpdate()
  }

  private toggleMenu(type: TableMenuType) {
    if (!this.getActiveCellPosition()) {
      this.closeMenu()
      return
    }

    if (this.activeMenuType === type) {
      this.closeMenu()
      return
    }

    this.activeMenuType = type
    this.dom.classList.add("jw-table-menu-open")
    this.menu.hidden = false
    this.renderMenu(type)
    this.updateMenuPosition(this.getActiveCellPosition()?.cell ?? null)
  }

  private closeMenu() {
    this.activeMenuType = null
    this.dom.classList.remove("jw-table-menu-open")
    this.menu.hidden = true
  }

  private updateMenuPosition(cell: HTMLTableCellElement | null) {
    if (!this.activeMenuType || !cell) {
      return
    }

    const wrapperRect = this.dom.getBoundingClientRect()
    const cellRect = cell.getBoundingClientRect()

    if (this.activeMenuType === "column") {
      this.menu.dataset.side = "top"
      this.menu.style.left = `${cellRect.left - wrapperRect.left + cellRect.width / 2}px`
      this.menu.style.top = `${cellRect.top - wrapperRect.top}px`
      return
    }

    this.menu.dataset.side = "left"
    this.menu.style.left = `${cellRect.left - wrapperRect.left}px`
    this.menu.style.top = `${cellRect.top - wrapperRect.top + cellRect.height / 2}px`
  }

  private renderMenu(type: TableMenuType) {
    this.menu.replaceChildren()

    const activeCell = this.getActiveCellPosition()
    if (!activeCell) {
      return
    }

    const rowCount = this.node.childCount
    const columnCount = this.getColumnCount()
    const isRowMenu = type === "row"
    const labels = getTableMenuLabels()
    const canMoveBackward = isRowMenu ? activeCell.rowIndex > 0 : activeCell.columnIndex > 0
    const canMoveForward = isRowMenu
      ? activeCell.rowIndex < rowCount - 1
      : activeCell.columnIndex < columnCount - 1

    this.menu.append(
      this.createMenuSection(labels.manage, [
        this.createMenuButton(isRowMenu ? labels.deleteRow : labels.deleteColumn, () => {
          if (isRowMenu) {
            this.deleteRow(activeCell.rowIndex)
          } else {
            this.deleteColumn(activeCell.columnIndex)
          }
        }, isRowMenu ? rowCount <= 1 : columnCount <= 1),
        this.createMenuButton(isRowMenu ? labels.clearRow : labels.clearColumn, () => {
          if (isRowMenu) {
            this.clearRowContents(activeCell.rowIndex)
          } else {
            this.clearColumnContents(activeCell.columnIndex)
          }
        }),
        this.createMenuButton(labels.duplicateContents, () => {
          if (isRowMenu) {
            this.duplicateRow(activeCell.rowIndex)
          } else {
            this.duplicateColumn(activeCell.columnIndex)
          }
        }),
      ]),
      this.createMenuSection(labels.position, [
        this.createMenuButton(isRowMenu ? labels.insertAbove : labels.insertLeft, () => {
          if (isRowMenu) {
            this.insertRow(activeCell.rowIndex, "before")
          } else {
            this.insertColumn(activeCell.columnIndex, "before")
          }
        }),
        this.createMenuButton(isRowMenu ? labels.insertBelow : labels.insertRight, () => {
          if (isRowMenu) {
            this.insertRow(activeCell.rowIndex, "after")
          } else {
            this.insertColumn(activeCell.columnIndex, "after")
          }
        }),
        this.createMenuButton(isRowMenu ? labels.moveUp : labels.moveLeft, () => {
          if (isRowMenu) {
            this.moveRow(activeCell.rowIndex, -1)
          } else {
            this.moveColumn(activeCell.columnIndex, -1)
          }
        }, !canMoveBackward),
        this.createMenuButton(isRowMenu ? labels.moveDown : labels.moveRight, () => {
          if (isRowMenu) {
            this.moveRow(activeCell.rowIndex, 1)
          } else {
            this.moveColumn(activeCell.columnIndex, 1)
          }
        }, !canMoveForward),
      ]),
      this.createColorSection(type, activeCell)
    )
  }

  private createMenuSection(label: string, items: HTMLButtonElement[]) {
    const section = document.createElement("div")
    section.className = "jw-table-menu-section"

    const title = document.createElement("div")
    title.className = "jw-table-menu-title"
    title.textContent = label

    section.append(title, ...items)
    return section
  }

  private createMenuButton(label: string, onClick: () => void, disabled = false) {
    const button = document.createElement("button")
    button.type = "button"
    button.className = "jw-table-menu-item"
    button.textContent = label
    button.disabled = disabled
    button.addEventListener("mousedown", (event) => {
      event.preventDefault()
    })
    button.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()

      if (button.disabled) {
        return
      }

      onClick()
      this.closeMenu()
      this.view.focus()
      this.scheduleControlsUpdate()
    })
    return button
  }

  private createColorSection(type: TableMenuType, activeCell: ActiveCellPosition) {
    const section = document.createElement("div")
    section.className = "jw-table-menu-section"

    const title = document.createElement("div")
    title.className = "jw-table-menu-title"
    title.textContent = getTableMenuLabels().background

    const colors = document.createElement("div")
    colors.className = "jw-table-menu-colors"

    HIGHLIGHT_COLORS.forEach((color) => {
      const button = document.createElement("button")
      button.type = "button"
      button.className = "jw-table-menu-color"
      button.style.backgroundColor = withTableBackgroundAlpha(color.value)
      button.title = color.label
      button.addEventListener("mousedown", (event) => {
        event.preventDefault()
      })
      button.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        const tableColor = withTableBackgroundAlpha(color.value)

        if (type === "row") {
          this.setRowBackground(activeCell.rowIndex, tableColor)
        } else {
          this.setColumnBackground(activeCell.columnIndex, tableColor)
        }

        this.closeMenu()
        this.view.focus()
        this.scheduleControlsUpdate()
      })
      colors.append(button)
    })

    section.append(title, colors)
    return section
  }

  private getColumnCount() {
    let columnCount = 0

    this.node.forEach((row) => {
      columnCount = Math.max(columnCount, row.childCount)
    })

    return columnCount
  }

  private getRows() {
    const rows: ProseMirrorNode[] = []

    this.node.forEach((row) => {
      rows.push(row)
    })

    return rows
  }

  private getCells(row: ProseMirrorNode) {
    const cells: ProseMirrorNode[] = []

    row.forEach((cell) => {
      cells.push(cell)
    })

    return cells
  }

  private cloneNode(node: ProseMirrorNode) {
    return node.copy(node.content)
  }

  private createBlankCell(referenceCell?: ProseMirrorNode) {
    const cellType = referenceCell?.type ?? this.view.state.schema.nodes.tableCell
    const attrs = referenceCell ? { ...referenceCell.attrs, backgroundColor: null } : null

    return cellType.createAndFill(attrs) ?? cellType.create(attrs)
  }

  private createBlankRow(referenceRow: ProseMirrorNode) {
    const cells = this.getCells(referenceRow).map((cell) => this.createBlankCell(cell))

    return referenceRow.type.create(
      referenceRow.attrs,
      Fragment.fromArray(cells),
      referenceRow.marks
    )
  }

  private createRowFromCells(row: ProseMirrorNode, cells: ProseMirrorNode[]) {
    return row.type.create(row.attrs, Fragment.fromArray(cells), row.marks)
  }

  private replaceTableRows(rows: ProseMirrorNode[]) {
    const tablePos = this.getTablePosition()
    if (tablePos === null) {
      return false
    }

    const nextTable = this.node.type.create(
      this.node.attrs,
      Fragment.fromArray(rows),
      this.node.marks
    )
    const transaction = this.view.state.tr.replaceWith(
      tablePos,
      tablePos + this.node.nodeSize,
      nextTable
    )

    this.view.dispatch(transaction.scrollIntoView())
    this.scheduleControlsUpdate()
    return true
  }

  private deleteRow(rowIndex: number) {
    const rows = this.getRows()
    if (rows.length <= 1) {
      return false
    }

    rows.splice(rowIndex, 1)
    return this.replaceTableRows(rows)
  }

  private deleteColumn(columnIndex: number) {
    if (this.getColumnCount() <= 1) {
      return false
    }

    const rows = this.getRows().map((row) => {
      const cells = this.getCells(row)

      if (columnIndex < cells.length) {
        cells.splice(columnIndex, 1)
      }

      return this.createRowFromCells(row, cells)
    })

    return this.replaceTableRows(rows)
  }

  private clearRowContents(rowIndex: number) {
    const rows = this.getRows().map((row, index) => {
      if (index !== rowIndex) {
        return row
      }

      return this.createRowFromCells(
        row,
        this.getCells(row).map((cell) => this.createBlankCell(cell))
      )
    })

    return this.replaceTableRows(rows)
  }

  private clearColumnContents(columnIndex: number) {
    const rows = this.getRows().map((row) => {
      const cells = this.getCells(row)

      if (columnIndex < cells.length) {
        cells[columnIndex] = this.createBlankCell(cells[columnIndex])
      }

      return this.createRowFromCells(row, cells)
    })

    return this.replaceTableRows(rows)
  }

  private duplicateRow(rowIndex: number) {
    const rows = this.getRows()
    const row = rows[rowIndex]

    if (!row) {
      return false
    }

    rows.splice(rowIndex + 1, 0, this.cloneNode(row))
    return this.replaceTableRows(rows)
  }

  private duplicateColumn(columnIndex: number) {
    const rows = this.getRows().map((row) => {
      const cells = this.getCells(row)
      const cell = cells[columnIndex]

      if (cell) {
        cells.splice(columnIndex + 1, 0, this.cloneNode(cell))
      }

      return this.createRowFromCells(row, cells)
    })

    return this.replaceTableRows(rows)
  }

  private insertRow(rowIndex: number, direction: "before" | "after") {
    const rows = this.getRows()
    const referenceRow = rows[rowIndex] ?? rows[0]

    if (!referenceRow) {
      return false
    }

    rows.splice(
      direction === "before" ? rowIndex : rowIndex + 1,
      0,
      this.createBlankRow(referenceRow)
    )
    return this.replaceTableRows(rows)
  }

  private insertColumn(columnIndex: number, direction: "before" | "after") {
    const insertOffset = direction === "before" ? 0 : 1
    const rows = this.getRows().map((row) => {
      const cells = this.getCells(row)
      const referenceCell = cells[columnIndex] ?? cells[cells.length - 1]

      cells.splice(columnIndex + insertOffset, 0, this.createBlankCell(referenceCell))
      return this.createRowFromCells(row, cells)
    })

    return this.replaceTableRows(rows)
  }

  private moveRow(rowIndex: number, direction: -1 | 1) {
    const rows = this.getRows()
    const targetIndex = rowIndex + direction

    if (targetIndex < 0 || targetIndex >= rows.length) {
      return false
    }

    const [row] = rows.splice(rowIndex, 1)
    if (!row) {
      return false
    }

    rows.splice(targetIndex, 0, row)
    return this.replaceTableRows(rows)
  }

  private moveColumn(columnIndex: number, direction: -1 | 1) {
    const targetIndex = columnIndex + direction

    if (targetIndex < 0 || targetIndex >= this.getColumnCount()) {
      return false
    }

    const rows = this.getRows().map((row) => {
      const cells = this.getCells(row)
      const [cell] = cells.splice(columnIndex, 1)

      if (cell) {
        cells.splice(targetIndex, 0, cell)
      }

      return this.createRowFromCells(row, cells)
    })

    return this.replaceTableRows(rows)
  }

  private setRowBackground(rowIndex: number, color: string) {
    const rows = this.getRows().map((row, index) => {
      if (index !== rowIndex) {
        return row
      }

      return this.createRowFromCells(
        row,
        this.getCells(row).map((cell) => this.setCellBackground(cell, color))
      )
    })

    return this.replaceTableRows(rows)
  }

  private setColumnBackground(columnIndex: number, color: string) {
    const rows = this.getRows().map((row) => {
      const cells = this.getCells(row)

      if (columnIndex < cells.length) {
        cells[columnIndex] = this.setCellBackground(cells[columnIndex], color)
      }

      return this.createRowFromCells(row, cells)
    })

    return this.replaceTableRows(rows)
  }

  private setCellBackground(cell: ProseMirrorNode, color: string) {
    return cell.type.create(
      { ...cell.attrs, backgroundColor: color },
      cell.content,
      cell.marks
    )
  }
}

export const TableWithControls = Table.extend({
  addNodeView() {
    return ({ node, editor, getPos }) =>
      new TableControlsView(node, editor, getPos)
  },
})

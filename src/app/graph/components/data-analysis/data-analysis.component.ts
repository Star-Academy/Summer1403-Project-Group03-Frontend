import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Data, DataSet, Edge, Network, Node } from 'vis';
import { LoadGraphService } from '../../services/load-graph/load-graph.service';
import { PageEvent } from '@angular/material/paginator';
import { MatMenuTrigger } from '@angular/material/menu';
import { ThemeService } from '../../../shared/services/theme.service';
import { getOptions, getSvg } from './graph-options';
import { MatDialog } from '@angular/material/dialog';
import { InfoDialogComponent } from './info-dialog/info-dialog.component';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { LoadingService } from '../../../shared/services/loading.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DangerSuccessNotificationComponent } from '../../../shared/components/danger-success-notification/danger-success-notification.component';
import { ColorPickerDialogComponent } from './color-picker-dialog/color-picker-dialog.component';

@Component({
  selector: 'app-data-analysis',
  templateUrl: './data-analysis.component.html',
  styleUrl: './data-analysis.component.scss',
  animations: [
    trigger('sidebar-fly', [
      state('startRound', style({ transform: 'translateX(0)' })),
      state('endRound', style({ transform: 'translateX(120%)' })),
      transition('* <=> *', [animate('500ms ease-in-out')]),
    ]),
    trigger('main-expand', [
      state('startRound', style({ width: 'calc(100% - 26rem)' })),
      state('endRound', style({ width: '100%' })),
      transition('* <=> *', [animate('500ms ease-in-out')]),
    ]),
  ],
})
export class DataAnalysisComponent implements AfterViewInit {
  @ViewChild(MatMenuTrigger, { static: true }) matMenuTrigger!: MatMenuTrigger;
  @ViewChild('menuTrigger', { read: ElementRef }) menuTrigger!: ElementRef;
  @ViewChild('network') el!: ElementRef;

  private networkInstance!: Network;
  public state = 'startRound';

  search = '';
  accounts: { id: number; entityName: string }[] = [];
  length!: number;
  pageIndex = 0;
  isDarkMode!: boolean;
  nodeColor!: string;
  selectedNodeColor!: string;

  nodes = new DataSet<Node>([] as unknown as Node[]);
  edges = new DataSet<Edge>([] as Edge[]);
  data: Data = { nodes: this.nodes, edges: this.edges };
  selectedNodes = new Set<number>();

  constructor(
    private themeService: ThemeService,
    private _snackBar: MatSnackBar,
    private loadGraphService: LoadGraphService,
    private dialog: MatDialog,
    private changeDetector: ChangeDetectorRef,
    private loadingService: LoadingService,
  ) {}

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.length = e.length;
    this.loadGraphService.getAllNodes(e.pageIndex);
  }

  ngAfterViewInit() {
    this.createGraph();
    this.themeService.theme$.subscribe((theme) => {
      this.isDarkMode = theme == 'dark';
      this.nodeColor = this.isDarkMode ? '#b5c4ff' : 'rgb(27, 89, 248)';
      this.selectedNodeColor = this.isDarkMode ? 'rgb(27, 89, 248)' : '#b5c4ff';
    });
    this.loadGraphService.nodesData$.subscribe({
      next: (data) => {
        this.accounts = data.items;
        this.length = data.totalItems;
        this.pageIndex = data.pageIndex;
        this.loadingService.setLoading(false);
      },
      error: (error) => {
        this._snackBar.openFromComponent(DangerSuccessNotificationComponent, {
          data: error.error.message,
          panelClass: ['notification-class-danger'],
          duration: 2000,
        });
        this.loadingService.setLoading(false);
      },
    });
    this.loadGraphService.getAllNodes();
    this.loadingService.setLoading(false);
  }

  private createGraph() {
    this.networkInstance = new Network(
      this.el.nativeElement,
      this.data,
      getOptions(),
    );

    // Listen for the context menu event (right-click)
    this.networkInstance.on('oncontext', (params) => {
      params.event.preventDefault();

      const nodeId = this.networkInstance.getNodeAt(params.pointer.DOM);
      const edgeId = this.networkInstance.getEdgeAt(params.pointer.DOM);

      if (nodeId !== undefined) {
        this.menuTrigger.nativeElement.style.left = params.event.clientX + 'px';
        this.menuTrigger.nativeElement.style.top = params.event.clientY + 'px';
        this.menuTrigger.nativeElement.style.position = 'fixed';
        this.matMenuTrigger.openMenu();

        this.changeDetector.detectChanges();
        const rightClickNodeInfoElem = document.getElementById(
          'right-click-node-info',
        ) as HTMLElement;

        rightClickNodeInfoElem.dataset['nodeid'] = nodeId.toString();

        // Custom logic for node right-click
      } else if (edgeId !== undefined) {
        console.log('Right-clicked edge:', edgeId);
        // Custom logic for edge right-click
      } else {
        console.log('Right-clicked on empty space');
        // Custom logic for right-click on empty space
      }
    });

    this.networkInstance.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];

        if (params.event.srcEvent.ctrlKey || params.event.srcEvent.metaKey) {
          this.toggleNodeSelection(nodeId);
        } else {
          this.handleSingleClick(nodeId);
        }

        console.log(this.selectedNodes);
      } else if (params.edges.length === 1) {
        this.handleEdgeClick(params.edges[0]);
      } else {
        this.clearAllSelections();
      }
    });
  }

  toggleNodeSelection(nodeId: number): void {
    if (this.selectedNodes.has(nodeId)) {
      this.deselectNode(nodeId);
    } else {
      this.selectNode(nodeId);
    }
  }

  handleSingleClick(nodeId: number): void {
    if (this.selectedNodes.has(nodeId)) {
      this.deselectNode(nodeId);
    } else {
      this.clearAllSelections();
      this.selectNode(nodeId);
    }
  }

  selectNode(nodeId: number): void {
    this.selectedNodes.add(nodeId);
    this.nodes.update({
      id: nodeId,
      image: getSvg(this.selectedNodeColor),
    });
  }

  deselectNode(nodeId: number): void {
    this.selectedNodes.delete(nodeId);
    this.nodes.update({
      id: nodeId,
      image: getSvg(this.nodeColor),
    });
  }

  clearAllSelections(): void {
    this.selectedNodes.forEach((selectedNodeId) => {
      this.nodes.update({
        id: selectedNodeId,
        image: getSvg(this.nodeColor),
      });
    });
    this.selectedNodes.clear();
  }

  handleEdgeClick(edgeId: number): void {
    console.log('edge click: ', edgeId);
  }

  getInfo(
    account: { id: number; entityName: string } = { id: 0, entityName: 'test' },
  ) {
    // todo: fix this
    // if (!account) {
    //   account = (
    //     document.getElementById('right-click-node-info') as HTMLElement
    //   ).dataset['nodeid'];
    // }

    this.loadGraphService.getNodeInfo(account.id).subscribe({
      next: (data) => {
        this.dialog.open(InfoDialogComponent, {
          width: '105rem',
          data,
        });
        this.loadingService.setLoading(false);
      },
      error: (error) => {
        this._snackBar.openFromComponent(DangerSuccessNotificationComponent, {
          data: error.error.message,
          panelClass: ['notification-class-danger'],
          duration: 2000,
        });
        this.loadingService.setLoading(false);
      },
    });
  }

  showAsGraph(account: { id: number; entityName: string }) {
    this.nodes.add({ id: account.id, label: account.entityName });
  }

  getGraph() {
    const nodeId = (
      document.getElementById('right-click-node-info') as HTMLElement
    ).dataset['nodeid'];

    this.loadGraphService.getGraph(Number(nodeId)!).subscribe({
      next: (data) => {
        data.nodes.forEach((newNode: Node) => {
          if (!this.nodes.get().find((n) => n.id == newNode.id)) {
            this.nodes.add(newNode);
          }
        });
        data.edges.forEach((newEdge: Edge) => {
          if (!this.edges.get().find((e) => e.id == newEdge.id)) {
            this.edges.add(newEdge);
          }
        });
        this.loadingService.setLoading(false);
      },
      error: (error) => {
        this._snackBar.openFromComponent(DangerSuccessNotificationComponent, {
          data: error.error.message,
          panelClass: ['notification-class-danger'],
          duration: 2000,
        });
        this.loadingService.setLoading(false);
      },
    });
  }

  changeState() {
    this.state = this.state == 'startRound' ? 'endRound' : 'startRound';
  }

  closeSearchBar() {
    this.changeState();
  }

  clearGraph() {
    this.nodes.clear();
  }

  testtt() {
    const dialogRef = this.dialog.open(ColorPickerDialogComponent, {
      width: '250px',
      data: { color: '#ff00ff' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.selectedNodes.size > 0) {
        this.changeNodeColors(result);
      }
    });
  }

  changeNodeColors(color: string) {
    this.selectedNodes.forEach((nodeId) => {
      // Update the node with the new color by generating a new SVG
      this.nodes.update({
        id: nodeId,
        image: getSvg(color), // Generate SVG with the selected color
      });
    });

    // Optionally clear the selection after updating
    this.selectedNodes.clear();
  }
}
